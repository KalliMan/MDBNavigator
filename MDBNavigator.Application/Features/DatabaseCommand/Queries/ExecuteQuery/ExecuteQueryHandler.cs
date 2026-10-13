using MDBNavigator.Application.Common;
using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.DTOs.Command;
using MDBNavigator.Application.Messaging;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Newtonsoft.Json;

namespace MDBNavigator.Application.Features.DatabaseCommand.Queries.ExecuteQuery
{
    public record ExecuteQueryQuery(string SessionId, string ConnectionId, string Id, string DatabaseName, string CmdQuery)
        : IQuery<CommandAcknowledgedDto>;

    public class ExecuteQueryHandler : IRequestHandler<ExecuteQueryQuery, CommandAcknowledgedDto>
    {
        private readonly IBackgroundTaskQueue _taskQueue;

        public ExecuteQueryHandler(IBackgroundTaskQueue taskQueue)
        {
            _taskQueue = taskQueue;
        }

        public Task<CommandAcknowledgedDto> Handle(ExecuteQueryQuery request, CancellationToken cancellationToken)
        {
            _taskQueue.EnqueueTask(async (scopeFactory, ct) =>
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var cache = scope.ServiceProvider.GetRequiredService<IConnectionCache>();
                var factory = scope.ServiceProvider.GetRequiredService<IDatabaseProviderFactory>();
                var notifier = scope.ServiceProvider.GetRequiredService<IBatchNotifier>();

                await using var provider = await DbConnectionHelper.CreateProviderAsync(cache, factory, request.SessionId, request.ConnectionId, request.DatabaseName);

                await foreach (var batch in provider.StreamQuery(request.CmdQuery, Constants.MAX_ROW_BATCH, ct: ct))
                {
                    var dto = new DatabaseCommandBatchResultDto
                    {
                        Id = $"{request.Id}_{batch.ResultSetIndex}",
                        CommandId = request.Id,
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

                    await notifier.SendBatchCommandResult(dto, request.SessionId);
                }
            });

            return Task.FromResult(new CommandAcknowledgedDto { Id = request.Id });
        }
    }
}
