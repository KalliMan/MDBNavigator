using MDBNavigator.BL.BackgroundTaskQueue;
using MDBNavigator.BL.BatchCommandResultHub;
using MDBNavigator.BL.Common;
using MDBNavigator.BL.DTOs;
using Models.Command;
using Newtonsoft.Json;
using System.Data;

namespace MDBNavigator.BL.Services
{
    public class QueryResultProcessor : IQueryResultProcessor
    {
        private readonly IBackgroundTaskQueue _backgroundTaskQueue;
        private readonly IBatchCommandResultHubProxy _batchCommandResultHubProxy;

        public QueryResultProcessor(IBackgroundTaskQueue backgroundTaskQueue, IBatchCommandResultHubProxy batchCommandResultHubProxy)
        {
            _backgroundTaskQueue = backgroundTaskQueue;
            _batchCommandResultHubProxy = batchCommandResultHubProxy;
        }

        public DatabaseSingleCommandResultDto ProcessQueryResult(string sessionId, string commandId, string id, DataTable rawResult)
        {
            var databaseSingleCommandResultDto = new DatabaseSingleCommandResultDto()
            {
                Id = id,
                RecordsAffected = rawResult.Rows.Count,
                RowCount = rawResult.Rows.Count,
                Fields = Enumerable.Range(0, rawResult.Columns.Count).Select(index => new DatabaseCommandResultFieldDto()
                {
                    Index = index,
                    FieldName = rawResult.Columns[index].ColumnName,
                    FieldType = rawResult.Columns[index].DataType.Name,
                    FieldDataTypeName = rawResult.Columns[index].DataType.FullName ?? rawResult.Columns[index].DataType.ToString(),
                }).ToList(),

                ResultJson = JsonConvert.SerializeObject(rawResult.AsEnumerable().Take(Constants.MAX_ROW_BATCH).Select(r => r.ItemArray))
            };

            if (rawResult.Rows.Count > Constants.MAX_ROW_BATCH)
            {
                _backgroundTaskQueue.EnqueueTask(async (cancellationToken) =>
                {
                    var skipCount = Constants.MAX_ROW_BATCH;
                    var maxIndex = ((rawResult.Rows.Count - Constants.MAX_ROW_BATCH) / Constants.MAX_ROW_BATCH) + 1;
                    for (int i = 0; i < maxIndex && skipCount < rawResult.Rows.Count; ++i)
                    {
                        var json = JsonConvert.SerializeObject(rawResult.AsEnumerable()
                            .Skip(skipCount)
                            .Take(Constants.MAX_ROW_BATCH).Select(r => r.ItemArray));

                        var batch = new DatabaseCommandBatchResultDto()
                        {
                            Id = databaseSingleCommandResultDto.Id,
                            CommandId = commandId,
                            Index = i,
                            ResultJson = json
                        };

                        await _batchCommandResultHubProxy.SendBatchCommandResult(batch, sessionId);

                        skipCount += Constants.MAX_ROW_BATCH;
                    }
                });
            }

            return databaseSingleCommandResultDto;
        }
    }
}