using MDBNavigator.Connections.Contracts;
using MDBNavigator.Providers.Abstractions;
using MDBNavigator.Providers.Abstractions.Queries;
using MDBNavigator.Workbench.Application.Queries.RunQuery;
using Microsoft.Extensions.Logging;
using System.Data.Common;
using System.Diagnostics;

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

        public QueryExecution(IDatabaseConnector connector, IBatchNotifier notifier, ICommandExecutionRegistry registry,
            QueryExecutionOptions options, ILogger<QueryExecution> logger, IDatabaseErrorDescriber? errorDescriber = null)
        {
            _connector = connector;
            _notifier = notifier;
            _registry = registry;
            _options = options;
            _logger = logger;
            _errorDescriber = errorDescriber;
        }

        // stoppingToken: the application is shutting down. cancellation: the user's Cancel, or a disconnect.
        public async Task RunAsync(RunQueryCommand command, CancellationTokenSource cancellation, CancellationToken stoppingToken)
        {
            using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken, cancellation.Token);
            var stopwatch = Stopwatch.StartNew();
            var stats = new QueryStreamStats();
            var status = CommandExecutionStatus.Completed;
            string? error = null;
            StatementStarted? current = null;

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
                    stats: stats,
                    ct: linkedCts.Token);

                await foreach (var item in stream)
                {
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
                            break;
                    }
                }
            }
            catch (Exception) when (linkedCts.IsCancellationRequested)
            {
                // Npgsql may surface a cancelled command as OperationCanceledException or PostgresException (57014).
                status = CommandExecutionStatus.Cancelled;
            }
            catch (Exception ex) when (ex is DbException or NotConnectedException or ConnectionNotAllowedException)
            {
                // An error in the user's SQL (syntax, missing table, constraint...), an expired connection or a
                // host the connection guard now refuses (its name resolves elsewhere) is expected, not a server fault.
                _logger.LogWarning("Query execution {ExecutionId} failed: {Message}", command.ExecutionId, ex.Message);
                status = CommandExecutionStatus.Failed;
                // The provider's describer adds the server's detail/hint (e.g. which objects block a DROP).
                error = AtStatement(_errorDescriber?.Describe(ex) ?? ex.Message, current);
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

        // A script's error says which statement failed; a single statement needs no such hint.
        private static string AtStatement(string error, StatementStarted? statement) =>
            statement is { StatementCount: > 1 }
                ? $"Statement {statement.StatementIndex + 1} of {statement.StatementCount} (line {statement.Line}): {error}"
                : error;
    }
}
