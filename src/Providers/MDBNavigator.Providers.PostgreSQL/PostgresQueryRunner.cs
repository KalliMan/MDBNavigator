using MDBNavigator.Providers.Abstractions;
using MDBNavigator.Providers.Abstractions.Queries;
using Npgsql;
using System.Runtime.CompilerServices;

namespace MDBNavigator.Providers.PostgreSQL
{
    internal sealed class PostgresQueryRunner : IQueryRunner
    {
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
            QueryStreamStats? stats = null,
            [EnumeratorCancellation] CancellationToken ct = default)
        {
            var statements = PostgresScriptSplitter.Split(script);
            // The connection was opened for this run, so no transaction is open yet.
            var inTransaction = false;

            for (var index = 0; index < statements.Count; index++)
            {
                var statement = statements[index];
                yield return new StatementStarted { StatementIndex = index, StatementCount = statements.Count, Line = statement.Line };

                // A batch command's text goes to the server untouched. Npgsql searches an NpgsqlCommand's text for
                // semicolons and splits it again, which breaks a function body written as BEGIN ATOMIC ... END.
                await using var batch = new NpgsqlBatch(_connection) { BatchCommands = { new NpgsqlBatchCommand(statement.Text) } };
                if (commandTimeoutSeconds.HasValue)
                {
                    batch.Timeout = commandTimeoutSeconds.Value;
                }
                await using var reader = await batch.ExecuteReaderAsync(ct);

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
                    var batchIndex = 0;
                    var isFirstBatch = true;
                    long resultRows = 0;
                    var limitReached = false;

                    while (await reader.ReadAsync(ct))
                    {
                        var row = new object?[reader.FieldCount];
                        for (int i = 0; i < reader.FieldCount; i++)
                            row[i] = reader.IsDBNull(i) ? null : JsonCellValue.From(reader.GetValue(i));
                        batchRows.Add(row);
                        resultRows++;
                        if (stats != null) stats.RowCount++;

                        if (maxRowsPerResultSet.HasValue && resultRows >= maxRowsPerResultSet.Value)
                        {
                            // One more row is read only to learn whether the result is longer; it is not sent.
                            // A result of exactly the limit is complete, not truncated.
                            limitReached = await reader.ReadAsync(ct);
                            break;
                        }

                        if (batchRows.Count == batchSize)
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
