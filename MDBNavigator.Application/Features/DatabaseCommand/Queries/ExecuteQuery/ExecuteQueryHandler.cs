using MDBNavigator.Application.Common;
using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.DTOs.Command;
using MDBNavigator.Application.Messaging;
using MDBNavigator.Domain.Exceptions;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Data.Common;
using System.Diagnostics;

namespace MDBNavigator.Application.Features.DatabaseCommand.Queries.ExecuteQuery
{
    public record ExecuteQueryQuery(string SessionId, string ConnectionId, string ExecutionId, string DatabaseName, string CmdQuery)
        : IQuery<CommandAcknowledgedDto>;

    public class ExecuteQueryHandler : IRequestHandler<ExecuteQueryQuery, CommandAcknowledgedDto>
    {
        private readonly IBackgroundTaskQueue _taskQueue;
        private readonly ICommandExecutionRegistry _registry;
        private readonly QueryExecutionOptions _options;

        public ExecuteQueryHandler(IBackgroundTaskQueue taskQueue, ICommandExecutionRegistry registry, QueryExecutionOptions options)
        {
            _taskQueue = taskQueue;
            _registry = registry;
            _options = options;
        }

        public Task<CommandAcknowledgedDto> Handle(ExecuteQueryQuery request, CancellationToken cancellationToken)
        {
            // Registered before enqueueing so the run can be cancelled while it still waits for a worker.
            var executionCts = _registry.Register(request.SessionId, request.ConnectionId, request.ExecutionId);
            var registry = _registry;
            var options = _options;

            _taskQueue.EnqueueTask(async (services, ct) =>
            {
                var notifier = services.GetRequiredService<IBatchNotifier>();
                var logger = services.GetRequiredService<ILogger<ExecuteQueryHandler>>();

                using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(ct, executionCts.Token);
                var stopwatch = Stopwatch.StartNew();
                var stats = new QueryStreamStats();
                var status = CommandExecutionStatus.Completed;
                string? error = null;

                try
                {
                    linkedCts.Token.ThrowIfCancellationRequested();

                    var cache = services.GetRequiredService<IConnectionCache>();
                    var factory = services.GetRequiredService<IDatabaseProviderFactory>();
                    await using var provider = await DbConnectionHelper.CreateProviderAsync(cache, factory, request.SessionId, request.ConnectionId, request.DatabaseName, linkedCts.Token);

                    var batches = provider.StreamQuery(
                        request.CmdQuery,
                        options.BatchSize,
                        commandTimeoutSeconds: options.CommandTimeoutSeconds,
                        maxRows: options.MaxRowsPerExecution > 0 ? options.MaxRowsPerExecution : null,
                        stats: stats,
                        ct: linkedCts.Token);

                    await foreach (var batch in batches)
                    {
                        await notifier.SendBatchCommandResult(ToDto(request, batch), request.SessionId);
                    }
                }
                catch (Exception) when (linkedCts.IsCancellationRequested)
                {
                    // Npgsql may surface a cancelled command as OperationCanceledException or PostgresException (57014).
                    status = CommandExecutionStatus.Cancelled;
                }
                catch (Exception ex) when (ex is DbException or NotConnectedException)
                {
                    // An error in the user's SQL (syntax, missing table, constraint...) or an expired connection
                    // is expected, not a server fault.
                    logger.LogWarning("Query execution {ExecutionId} failed: {Message}", request.ExecutionId, ex.Message);
                    status = CommandExecutionStatus.Failed;
                    // The provider's describer adds the server's detail/hint (e.g. which objects block a DROP).
                    error = services.GetService<IDatabaseErrorDescriber>()?.Describe(ex) ?? ex.Message;
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Query execution {ExecutionId} failed unexpectedly", request.ExecutionId);
                    status = CommandExecutionStatus.Failed;
                    error = ex.Message;
                }
                finally
                {
                    registry.Complete(request.SessionId, request.ExecutionId, executionCts);
                }

                await notifier.SendCommandFinished(new CommandFinishedDto
                {
                    ExecutionId = request.ExecutionId,
                    Status = status,
                    RowCount = stats.RowCount,
                    RecordsAffected = stats.RecordsAffected,
                    ElapsedMs = stopwatch.ElapsedMilliseconds,
                    Truncated = stats.Truncated,
                    Error = error
                }, request.SessionId);
            });

            return Task.FromResult(new CommandAcknowledgedDto { Id = request.ExecutionId });
        }

        private static DatabaseCommandBatchResultDto ToDto(ExecuteQueryQuery request, QueryBatch batch) => new()
        {
            Id = $"{request.ExecutionId}_{batch.ResultSetIndex}",
            ExecutionId = request.ExecutionId,
            Index = batch.BatchIndex,
            ResultSetIndex = batch.ResultSetIndex,
            IsFirstBatch = batch.IsFirstBatch,
            IsLastBatch = batch.IsLastBatch,
            Fields = batch.IsFirstBatch
                ? batch.Columns?.Select((c, i) => new DatabaseCommandResultFieldDto
                {
                    Index = i,
                    FieldName = c.Name,
                    FieldType = c.TypeName,
                    FieldDataTypeName = c.FullTypeName
                })
                : null,
            Rows = batch.Rows
        };
    }
}
