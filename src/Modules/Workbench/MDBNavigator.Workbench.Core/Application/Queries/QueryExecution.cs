using MDBNavigator.Connections.Contracts;
using MDBNavigator.Providers.Abstractions;
using MDBNavigator.Providers.Abstractions.Queries;
using MDBNavigator.SharedKernel;
using MDBNavigator.SharedKernel.Violations;
using MDBNavigator.Workbench.Application.Queries.RunQuery;
using Microsoft.Extensions.Logging;
using System.Data.Common;
using System.Diagnostics;
using System.Globalization;

namespace MDBNavigator.Workbench.Application.Queries
{
    // One run of a script, on a worker and in the worker's own scope: opens the database, streams the result to the
    // browser, and always ends with exactly one CommandFinished message.
    public class QueryExecution
    {
        private readonly IDatabaseConnector _connector;
        private readonly IBatchNotifier _notifier;
        private readonly ICommandExecutionRegistry _registry;
        private readonly QueryExecutionOptions _options;
        private readonly ILogger<QueryExecution> _logger;
        private readonly IDatabaseErrorDescriber? _errorDescriber;
        // Only in the public demo, which counts refused actions against a guest.
        private readonly IViolationRecorder? _violations;

        // Added to the error of the run whose refusal ended the session (the public demo's limit of refused actions).
        public const string SessionEndedNote = "\n\nThis session has ended after too many refused actions.";

        public QueryExecution(IDatabaseConnector connector, IBatchNotifier notifier, ICommandExecutionRegistry registry,
            QueryExecutionOptions options, ILogger<QueryExecution> logger, IDatabaseErrorDescriber? errorDescriber = null,
            IViolationRecorder? violations = null)
        {
            _connector = connector;
            _notifier = notifier;
            _registry = registry;
            _options = options;
            _logger = logger;
            _errorDescriber = errorDescriber;
            _violations = violations;
        }

        // stoppingToken: the application is shutting down. cancellation: the user's Cancel, or a disconnect.
        public async Task RunAsync(RunQueryCommand command, CancellationTokenSource cancellation, CancellationToken stoppingToken)
        {
            // The run's own limits (MaxRunSeconds, MaxRowsPerRun) stop it through this token, like a Cancel, so the
            // database stops the statement at once. The outcome tells them apart from the user's Cancel.
            using var runLimit = new CancellationTokenSource();
            using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken, cancellation.Token, runLimit.Token);
            if (_options.MaxRunSeconds > 0)
            {
                runLimit.CancelAfter(TimeSpan.FromSeconds(_options.MaxRunSeconds));
            }

            var rowLimitReached = false;
            var stopwatch = Stopwatch.StartNew();
            var stats = new QueryStreamStats();
            var status = CommandExecutionStatus.Completed;
            string? error = null;
            StatementStarted? current = null;
            // What the server refused, if anything; a mistake in the SQL is not counted.
            ViolationKind? violation = null;

            try
            {
                linkedCts.Token.ThrowIfCancellationRequested();

                await using var database = await _connector
                    .OpenAsync(command.SessionId, command.ConnectionId, command.DatabaseName, linkedCts.Token);

                var stream = database.Queries.StreamQuery(
                    command.CmdQuery,
                    _options.BatchSize,
                    commandTimeoutSeconds: _options.CommandTimeoutSeconds,
                    maxRowsPerResultSet: _options.MaxRowsPerResultSet > 0 ? _options.MaxRowsPerResultSet : null,
                    maxRowBytes: _options.MaxRowBytes > 0 ? _options.MaxRowBytes : null,
                    stats: stats,
                    ct: linkedCts.Token);

                await foreach (var item in stream)
                {
                    // Once a limit has stopped the run, nothing more goes to the browser. The stream then ends with an
                    // exception at its next read or statement (PostgresQueryRunner). Never break out of the loop
                    // instead: that would dispose the reader, which reads every remaining row first.
                    if (runLimit.IsCancellationRequested)
                    {
                        continue;
                    }

                    switch (item)
                    {
                        case StatementStarted started:
                            current = started;
                            await _notifier.SendStatementStarted(new StatementStartedDto
                            {
                                ExecutionId = command.ExecutionId,
                                StatementIndex = started.StatementIndex,
                                StatementCount = started.StatementCount,
                                Line = started.Line
                            }, command.SessionId);
                            break;
                        case QueryBatch batch:
                            await _notifier.SendBatchCommandResult(ToDto(command, batch), command.SessionId);
                            // More than the limit, not the limit itself: one result of exactly MaxRowsPerResultSet rows
                            // is complete. The batch that crosses it has been sent.
                            if (_options.MaxRowsPerRun > 0 && stats.RowCount > _options.MaxRowsPerRun)
                            {
                                rowLimitReached = true;
                                runLimit.Cancel();
                            }
                            break;
                    }
                }
            }
            catch (Exception) when (linkedCts.IsCancellationRequested)
            {
                if (runLimit.IsCancellationRequested && !cancellation.IsCancellationRequested && !stoppingToken.IsCancellationRequested)
                {
                    // One of this server's limits, not the user: a failure with the reason, shown in the Error tab.
                    status = CommandExecutionStatus.Failed;
                    error = AtStatement(rowLimitReached ? RowLimitMessage() : TimeLimitMessage(), current);
                    violation = ViolationKind.LimitReached;
                    _logger.LogInformation("Query execution {ExecutionId} stopped at the run's {Limit} limit",
                        command.ExecutionId, rowLimitReached ? "row" : "time");
                }
                else
                {
                    // Npgsql may surface a cancelled command as OperationCanceledException or PostgresException (57014).
                    status = CommandExecutionStatus.Cancelled;
                }
            }
            catch (Exception ex) when (ex is DbException or NotConnectedException or ConnectionNotAllowedException)
            {
                // An error in the user's SQL (syntax, missing table, constraint...), an expired connection or a
                // host the connection guard now refuses (its name resolves elsewhere) is expected, not a server fault.
                _logger.LogWarning("Query execution {ExecutionId} failed: {Message}", command.ExecutionId, ex.Message);
                status = CommandExecutionStatus.Failed;
                // The provider's describer adds the server's detail/hint (e.g. which objects block a DROP).
                error = AtStatement(_errorDescriber?.Describe(ex) ?? ex.Message, current);
                violation = ToViolation(ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Query execution {ExecutionId} failed unexpectedly", command.ExecutionId);
                status = CommandExecutionStatus.Failed;
                error = AtStatement(ex.Message, current);
            }
            finally
            {
                _registry.Complete(command.SessionId, command.ExecutionId, cancellation);
            }

            // After the run is completed in the registry: ending the session deletes the account, which stops its runs.
            if (violation is { } kind && _violations is not null
                && await _violations.RecordAsync(SessionKey.UserIdOf(command.SessionId), kind))
            {
                error += SessionEndedNote;
            }

            await _notifier.SendCommandFinished(new CommandFinishedDto
            {
                ExecutionId = command.ExecutionId,
                Status = status,
                RowCount = stats.RowCount,
                RecordsAffected = stats.RecordsAffected,
                ElapsedMs = stopwatch.ElapsedMilliseconds,
                Truncated = stats.Truncated,
                Error = error
            }, command.SessionId);
        }

        // Refused on purpose (rights, the guard, the database's limits); not an expired connection or a mistake.
        private ViolationKind? ToViolation(Exception ex) => ex switch
        {
            ConnectionNotAllowedException => ViolationKind.ConnectionRefused,
            DbException => _errorDescriber?.Classify(ex) switch
            {
                DatabaseErrorKind.PermissionDenied => ViolationKind.PermissionDenied,
                DatabaseErrorKind.LimitReached => ViolationKind.LimitReached,
                _ => null
            },
            _ => null
        };

        private static DatabaseCommandBatchResultDto ToDto(RunQueryCommand command, QueryBatch batch) => new()
        {
            Id = $"{command.ExecutionId}_{batch.ResultSetIndex}",
            ExecutionId = command.ExecutionId,
            Index = batch.BatchIndex,
            ResultSetIndex = batch.ResultSetIndex,
            IsFirstBatch = batch.IsFirstBatch,
            IsLastBatch = batch.IsLastBatch,
            Fields = batch.IsFirstBatch
                ? batch.Columns?.Select((c, i) => new DatabaseCommandResultFieldDto
                {
                    Index = i,
                    FieldName = c.Name,
                    Category = c.Category,
                    DataTypeName = c.DataTypeName
                })
                : null,
            Rows = batch.Rows,
            Truncated = batch.Truncated,
            SkippingRest = batch.SkippingRest
        };

        private string TimeLimitMessage() =>
            string.Create(CultureInfo.InvariantCulture,
                $"Stopped after {_options.MaxRunSeconds} seconds, this server's time limit for one run.");

        private string RowLimitMessage() =>
            string.Create(CultureInfo.InvariantCulture,
                $"Stopped after more than {_options.MaxRowsPerRun:N0} rows in total, this server's row limit for one run; the rest of the script was not run.");

        // A script's error says which statement failed; a single statement needs no such hint.
        private static string AtStatement(string error, StatementStarted? statement) =>
            statement is { StatementCount: > 1 }
                ? $"Statement {statement.StatementIndex + 1} of {statement.StatementCount} (line {statement.Line}): {error}"
                : error;
    }
}
