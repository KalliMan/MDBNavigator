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
        : IQuery<DatabaseCommandResultDto>;

    public class ExecuteQueryHandler : IRequestHandler<ExecuteQueryQuery, DatabaseCommandResultDto>
    {
        private readonly IConnectionCache _cache;
        private readonly IDatabaseProviderFactory _factory;
        private readonly IBackgroundTaskQueue _taskQueue;

        public ExecuteQueryHandler(IConnectionCache cache, IDatabaseProviderFactory factory, IBackgroundTaskQueue taskQueue)
        {
            _cache = cache;
            _factory = factory;
            _taskQueue = taskQueue;
        }

        public async Task<DatabaseCommandResultDto> Handle(ExecuteQueryQuery request, CancellationToken cancellationToken)
        {
            await using var provider = await DbConnectionHelper.CreateProviderAsync(_cache, _factory, request.SessionId, request.ConnectionId, request.DatabaseName);
            var rawResult = await provider.ExecuteQuery(request.CmdQuery);

            var results = rawResult.Results.Select(table => BuildSingleResult(request.SessionId, request.Id, table)).ToList();

            return new DatabaseCommandResultDto { Id = request.Id, Results = results };
        }

        private DatabaseSingleCommandResultDto BuildSingleResult(string sessionId, string commandId, System.Data.DataTable table)
        {
            var resultId = Guid.NewGuid().ToString();
            var dto = new DatabaseSingleCommandResultDto
            {
                Id = resultId,
                RecordsAffected = table.Rows.Count,
                RowCount = table.Rows.Count,
                Fields = Enumerable.Range(0, table.Columns.Count).Select(i => new DatabaseCommandResultFieldDto
                {
                    Index = i,
                    FieldName = table.Columns[i].ColumnName,
                    FieldType = table.Columns[i].DataType.Name,
                    FieldDataTypeName = table.Columns[i].DataType.FullName ?? table.Columns[i].DataType.ToString()
                }).ToList(),
                ResultJson = JsonConvert.SerializeObject(Enumerable.Range(0, Math.Min(table.Rows.Count, Constants.MAX_ROW_BATCH)).Select(i => table.Rows[i].ItemArray))
            };

            if (table.Rows.Count > Constants.MAX_ROW_BATCH)
            {
                EnqueueRemainingBatches(sessionId, commandId, resultId, table);
            }

            return dto;
        }

        private void EnqueueRemainingBatches(string sessionId, string commandId, string resultId, System.Data.DataTable table)
        {
            _taskQueue.EnqueueTask(async (scopeFactory, cancellationToken) =>
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var notifier = scope.ServiceProvider.GetRequiredService<IBatchNotifier>();

                var skip = Constants.MAX_ROW_BATCH;
                var batchIndex = 0;
                while (skip < table.Rows.Count)
                {
                    var json = JsonConvert.SerializeObject(
                        Enumerable.Range(skip, Math.Min(Constants.MAX_ROW_BATCH, table.Rows.Count - skip)).Select(i => table.Rows[i].ItemArray));

                    await notifier.SendBatchCommandResult(new DatabaseCommandBatchResultDto
                    {
                        Id = resultId,
                        CommandId = commandId,
                        Index = batchIndex,
                        ResultJson = json
                    }, sessionId);

                    skip += Constants.MAX_ROW_BATCH;
                    batchIndex++;
                }
            });
        }
    }
}
