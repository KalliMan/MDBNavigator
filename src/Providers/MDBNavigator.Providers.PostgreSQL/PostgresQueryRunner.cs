using MDBNavigator.Providers.Abstractions;
using MDBNavigator.Providers.Abstractions.Queries;
using Npgsql;
using System.Data;
using System.Runtime.CompilerServices;

namespace MDBNavigator.Providers.PostgreSQL
{
    internal sealed class PostgresQueryRunner : IQueryRunner
    {
        // Values of this size or less are always read whole: numbers, dates, booleans, short text. Only big values are
        // cut, so a number column never shows a note instead of a number.
        private const int SmallValueBytes = 1024;

        // A batch is sent when it has batchSize rows or its values reach this many bytes, so wide rows don't pile up
        // hundreds of megabytes in one message.
        private const int BatchTargetBytes = 1024 * 1024;

        private readonly NpgsqlConnection _connection;

        public PostgresQueryRunner(NpgsqlConnection connection)
        {
            _connection = connection;
        }

        // Runs the script statement by statement, as psql does (see PostgresScriptSplitter). The row limit counts
        // per result set, and a result that hits it no longer takes the rest of the script with it.
        //
        // How a result is stopped at the limit depends on what is safe:
        // - Cancel, when the statement only reads and no transaction of the user is open. It is immediate, and the
        //   next statement runs normally.
        // - Skip otherwise: read the remaining rows and throw them away. A cancel is an error for PostgreSQL: inside
        //   the user's transaction it would abort it (25P02 on the next statement), and for a statement that
        //   changes data (UPDATE ... RETURNING) it would undo the changes.
        // When unsure, skip: it is slower and never wrong.
        public async IAsyncEnumerable<QueryStreamItem> StreamQuery(
            string script,
            int batchSize,
            int? commandTimeoutSeconds = null,
            int? maxRowsPerResultSet = null,
            int? maxRowBytes = null,
            QueryStreamStats? stats = null,
            [EnumeratorCancellation] CancellationToken ct = default)
        {
            var statements = PostgresScriptSplitter.Split(script);
            // The connection was opened for this run, so no transaction is open yet.
            var inTransaction = false;

            for (var index = 0; index < statements.Count; index++)
            {
                // A run stopped between two statements (Cancel, or one of the run's limits) doesn't start the next one.
                // Checked only here, where no reader is open: throwing in the middle of a result would make disposing
                // the reader read all of its remaining rows first.
                ct.ThrowIfCancellationRequested();

                var statement = statements[index];
                yield return new StatementStarted { StatementIndex = index, StatementCount = statements.Count, Line = statement.Line, Offset = statement.Offset };

                // A batch command's text goes to the server untouched. Npgsql searches an NpgsqlCommand's text for
                // semicolons and splits it again, which breaks a function body written as BEGIN ATOMIC ... END.
                await using var batch = new NpgsqlBatch(_connection) { BatchCommands = { new NpgsqlBatchCommand(statement.Text) } };
                if (commandTimeoutSeconds.HasValue)
                {
                    batch.Timeout = commandTimeoutSeconds.Value;
                }
                // SequentialAccess: values come off the network one by one instead of the whole row first, so a value
                // that is cut is never held in memory (Npgsql skips its bytes).
                await using var reader = await batch.ExecuteReaderAsync(CommandBehavior.SequentialAccess, ct);

                var cancelled = false;
                if (reader.FieldCount > 0)
                {
                    var columns = Enumerable.Range(0, reader.FieldCount)
                        .Select(i =>
                        {
                            var dataTypeName = reader.GetDataTypeName(i);
                            return new ColumnInfo(reader.GetName(i), CategoryOf(reader.GetFieldType(i), dataTypeName), dataTypeName);
                        })
                        .ToArray();

                    var batchRows = new List<object?[]>(batchSize);
                    long batchBytes = 0;
                    var batchIndex = 0;
                    var isFirstBatch = true;
                    long resultRows = 0;
                    var limitReached = false;

                    while (await reader.ReadAsync(ct))
                    {
                        var (row, rowBytes) = await ReadRowAsync(reader, columns, maxRowBytes, ct);
                        batchRows.Add(row);
                        batchBytes += rowBytes;
                        resultRows++;
                        if (stats != null) stats.RowCount++;

                        if (maxRowsPerResultSet.HasValue && resultRows >= maxRowsPerResultSet.Value)
                        {
                            // One more row is read only to learn whether the result is longer; it is not sent.
                            // A result of exactly the limit is complete, not truncated.
                            limitReached = await reader.ReadAsync(ct);
                            break;
                        }

                        if (batchRows.Count == batchSize || batchBytes >= BatchTargetBytes)
                        {
                            yield return new QueryBatch
                            {
                                ResultSetIndex = index,
                                IsFirstBatch = isFirstBatch,
                                IsLastBatch = false,
                                BatchIndex = batchIndex,
                                Columns = isFirstBatch ? columns : null,
                                Rows = batchRows.ToArray()
                            };
                            isFirstBatch = false;
                            batchIndex++;
                            batchRows.Clear();
                            batchBytes = 0;
                        }
                    }

                    var canCancel = limitReached && PostgresStatementRules.CanCancelAtRowLimit(statement, inTransaction);

                    // Yielded before the cancel or the skipping starts, so the browser has the rows and its tab
                    // while the server is still busy.
                    yield return new QueryBatch
                    {
                        ResultSetIndex = index,
                        IsFirstBatch = isFirstBatch,
                        IsLastBatch = true,
                        BatchIndex = batchIndex,
                        Columns = isFirstBatch ? columns : null,
                        Rows = batchRows.ToArray(),
                        Truncated = limitReached,
                        SkippingRest = limitReached && !canCancel
                    };

                    if (limitReached)
                    {
                        if (stats != null) stats.Truncated = true;
                        if (canCancel)
                        {
                            await StopReaderAsync(batch, reader);
                            cancelled = true;
                        }
                        else
                        {
                            // The user's Cancel still stops this: ReadAsync(ct) throws.
                            while (await reader.ReadAsync(ct)) { }
                        }
                    }
                }

                if (!cancelled)
                {
                    // The count is known once the reader is past the statement.
                    await reader.NextResultAsync(ct);
                    if (stats != null && reader.RecordsAffected >= 0)
                    {
                        stats.RecordsAffected = Math.Max(stats.RecordsAffected, 0) + reader.RecordsAffected;
                    }
                }

                inTransaction = PostgresStatementRules.InTransactionAfter(statement, inTransaction);
            }
        }

        // The plan of one statement (see PostgresExplain). The statement is built before anything goes to the server,
        // so a script that can't be explained fails without a connection round trip.
        public async IAsyncEnumerable<QueryStreamItem> StreamPlan(
            string script,
            bool analyze,
            int? commandTimeoutSeconds = null,
            int? maxRowBytes = null,
            [EnumeratorCancellation] CancellationToken ct = default)
        {
            var (text, line, offset, prefixLength) = PostgresExplain.Build(script, analyze);
            yield return new StatementStarted { StatementIndex = 0, StatementCount = 1, Line = line, Offset = offset, PrefixLength = prefixLength };

            var plan = await ReadPlanAsync(text, analyze, commandTimeoutSeconds, maxRowBytes, ct);
            yield return new QueryBatch
            {
                ResultSetIndex = 0,
                IsFirstBatch = true,
                IsLastBatch = true,
                BatchIndex = 0,
                Columns = [new ColumnInfo("QUERY PLAN", DbTypeCategory.Json, "json")],
                Rows = [[plan]]
            };
        }

        // EXPLAIN ANALYZE runs the statement, so it goes between BEGIN and ROLLBACK, never COMMIT, on this run's own
        // connection. They are separate commands, not one script: the splitter would count three statements.
        private async Task<string> ReadPlanAsync(string text, bool analyze, int? commandTimeoutSeconds, int? maxRowBytes, CancellationToken ct)
        {
            if (analyze)
            {
                await ExecuteAsync("BEGIN", commandTimeoutSeconds, ct);
            }

            try
            {
                await using var batch = NewBatch(text, commandTimeoutSeconds);
                string plan;
                await using (var reader = await batch.ExecuteReaderAsync(CommandBehavior.SequentialAccess, ct))
                {
                    if (!await reader.ReadAsync(ct))
                    {
                        throw new InvalidOperationException("EXPLAIN returned no plan.");
                    }

                    // The size first, so a plan over the limit is refused instead of read: a cut JSON can't be parsed.
                    var size = reader.GetBytes(0, 0, null, 0, 0);
                    if (maxRowBytes.HasValue && size > maxRowBytes.Value)
                    {
                        throw new InvalidScriptException(
                            $"The plan is {CutCellText.Size(size)}, more than this server's limit of {CutCellText.Size(maxRowBytes.Value)} per row (QueryExecution:MaxRowBytes).");
                    }

                    plan = await reader.GetFieldValueAsync<string>(0, ct);
                }
                return plan;
            }
            finally
            {
                if (analyze)
                {
                    try
                    {
                        await ExecuteAsync("ROLLBACK", commandTimeoutSeconds, CancellationToken.None);
                    }
                    catch (Exception)
                    {
                        // After a cancel or a broken connection the ROLLBACK can fail. Nothing is left behind: the run's
                        // connection is closed when the run ends, and closing it rolls back an open transaction too.
                    }
                }
            }
        }

        private async Task ExecuteAsync(string statement, int? commandTimeoutSeconds, CancellationToken ct)
        {
            await using var batch = NewBatch(statement, commandTimeoutSeconds);
            await batch.ExecuteNonQueryAsync(ct);
        }

        private NpgsqlBatch NewBatch(string text, int? commandTimeoutSeconds)
        {
            var batch = new NpgsqlBatch(_connection) { BatchCommands = { new NpgsqlBatchCommand(text) } };
            if (commandTimeoutSeconds.HasValue)
            {
                batch.Timeout = commandTimeoutSeconds.Value;
            }
            return batch;
        }

        // One row's values, in column order (SequentialAccess allows no going back), as JSON cell values, and the
        // bytes read, for the batch's size. Async reads only: in SequentialAccess a synchronous read of a big value
        // would block a thread on the network.
        private static async Task<(object?[] Row, long Bytes)> ReadRowAsync(
            NpgsqlDataReader reader, ColumnInfo[] columns, int? maxRowBytes, CancellationToken ct)
        {
            var row = new object?[columns.Length];
            long rowBytes = 0;
            for (var i = 0; i < columns.Length; i++)
            {
                if (await reader.IsDBNullAsync(i, ct))
                {
                    continue;
                }

                // The value's size as PostgreSQL sent it, for every type. IsDBNullAsync has read it already.
                var size = reader.GetBytes(i, 0, null, 0, 0);
                if (maxRowBytes.HasValue && size > SmallValueBytes && rowBytes + size > maxRowBytes.Value)
                {
                    var cut = await CutValueAsync(reader, i, columns[i].Category, size, ct);
                    row[i] = cut;
                    rowBytes += cut.Length;
                    continue;
                }

                row[i] = JsonCellValue.From(await reader.GetFieldValueAsync<object>(i, ct));
                rowBytes += size;
            }

            return (row, rowBytes);
        }

        // Text and JSON keep their beginning, so the user still sees what the value is; anything else gets only its size.
        private static async Task<string> CutValueAsync(
            NpgsqlDataReader reader, int ordinal, DbTypeCategory category, long size, CancellationToken ct)
        {
            string? preview = null;
            if (category is DbTypeCategory.Text or DbTypeCategory.Json)
            {
                try
                {
                    using var text = await reader.GetTextReaderAsync(ordinal, ct);
                    var buffer = new char[CutCellText.PreviewChars];
                    var read = 0;
                    int count;
                    while (read < buffer.Length && (count = await text.ReadAsync(buffer.AsMemory(read), ct)) > 0)
                    {
                        read += count;
                    }

                    // Half of a surrogate pair at the end is not a character.
                    if (read > 0 && char.IsHighSurrogate(buffer[read - 1]))
                    {
                        read--;
                    }

                    preview = new string(buffer, 0, read);
                }
                catch (InvalidCastException)
                {
                    // A text type Npgsql can't read as a stream (from an extension): the size alone.
                }
            }

            return CutCellText.For(preview, size);
        }

        // json and jsonb arrive as strings, so the .NET type alone would call them Text.
        private static DbTypeCategory CategoryOf(Type clrType, string dataTypeName) =>
            dataTypeName is "json" or "jsonb" ? DbTypeCategory.Json : DbTypeCategories.FromClrType(clrType);

        // Disposing a reader reads all remaining rows, so the command is cancelled server-side first.
        // The resulting "query canceled" error is expected and swallowed.
        private static async Task StopReaderAsync(NpgsqlBatch batch, NpgsqlDataReader reader)
        {
            try
            {
                batch.Cancel();
                await reader.DisposeAsync();
            }
            catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.QueryCanceled)
            {
            }
            catch (OperationCanceledException)
            {
            }
        }
    }
}
