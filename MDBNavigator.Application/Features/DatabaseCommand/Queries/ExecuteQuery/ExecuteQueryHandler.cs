using MDBNavigator.Application.Common;
using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.DTOs.Command;
using MDBNavigator.Application.Messaging;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System.Diagnostics;

namespace MDBNavigator.Application.Features.DatabaseCommand.Queries.ExecuteQuery
{
    public record ExecuteQueryQuery(string SessionId, string ConnectionId, string Id, string ExecutionId, string DatabaseName, string CmdQuery)
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
            var executionCts = _registry.Register(request.SessionId, request.ConnectionId, request.Id);
            var registry = _registry;
            var options = _options;

            _taskQueue.EnqueueTask(async (scopeFactory, ct) =>
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var notifier = scope.ServiceProvider.GetRequiredService<IBatchNotifier>();
                var logger = scope.ServiceProvider.GetRequiredService<ILogger<ExecuteQueryHandler>>();

                using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(ct, executionCts.Token);
                var stopwatch = Stopwatch.StartNew();
                var stats = new QueryStreamStats();
                var status = CommandExecutionStatus.Completed;
                string? error = null;

                try
                {
                    linkedCts.Token.ThrowIfCancellationRequested();

                    var cache = scope.ServiceProvider.GetRequiredService<IConnectionCache>();
                    var factory = scope.ServiceProvider.GetRequiredService<IDatabaseProviderFactory>();
                    await using var provider = await DbConnectionHelper.CreateProviderAsync(cache, factory, request.SessionId, request.ConnectionId, request.DatabaseName);

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
                catch (Exception ex)
                {
                    logger.LogError(ex, "Query execution {CommandId} failed", request.Id);
                    status = CommandExecutionStatus.Failed;
                    // The provider's describer adds the server's detail/hint (e.g. which objects block a DROP).
                    error = scope.ServiceProvider.GetService<IDatabaseErrorDescriber>()?.Describe(ex) ?? ex.Message;
                }
                finally
                {
                    registry.Complete(request.SessionId, request.Id, executionCts);
                }

                await notifier.SendCommandFinished(new CommandFinishedDto
                {
                    CommandId = request.Id,
                    ExecutionId = request.ExecutionId,
                    Status = status,
                    RowCount = stats.RowCount,
                    RecordsAffected = stats.RecordsAffected,
                    ElapsedMs = stopwatch.ElapsedMilliseconds,
                    Truncated = stats.Truncated,
                    Error = error
                }, request.SessionId);
            });

            return Task.FromResult(new CommandAcknowledgedDto { Id = request.Id });
        }

        private static DatabaseCommandBatchResultDto ToDto(ExecuteQueryQuery request, QueryBatch batch) => new()
        {
            Id = $"{request.Id}_{batch.ResultSetIndex}",
            CommandId = request.Id,
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
            ResultJson = JsonConvert.SerializeObject(batch.Rows)
        };
    }
}
