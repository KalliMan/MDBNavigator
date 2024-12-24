using MDBNavigator.BL.Cache;
using MDBNavigator.DAL;
using Models;
using Newtonsoft.Json;


//using MDBNavigator.BL.Common;
//using MDBNavigator.BL.HostedServiceQueue;
//using MDBNavigator.BL.SignalR;
//using MDBNavigator.DAL;
//using Models;
//using Newtonsoft.Json;
using System.Data;

namespace MDBNavigator.BL.Services
{
    public class DBManager : IDBManager
    {
        private readonly IConnectionSettingsMemoryCache _memoryCache;
//        private readonly IBackgroundTaskQueue _backgroundTaskQueue;
  //      private readonly IBatchResultNotification _batchResultNotification;

        public DBManager(IConnectionSettingsMemoryCache memoryCache/*, IBackgroundTaskQueue backgroundTaskQueue, IBatchResultNotification batchResultNotification*/)
        {
            _memoryCache = memoryCache;
         //   _backgroundTaskQueue = backgroundTaskQueue;
          //  _batchResultNotification = batchResultNotification;
        }

        public async Task<bool> Connect(string sessionId, ConnectionSettings details)
        {
            _memoryCache.Remove(sessionId);

            using var connection = await DBConnection.CreateConnection(details);            
            _memoryCache.Set(sessionId, details);
            return true;
//            return connection.GetDetails();
        }
        
        public async Task<DatabasesDetailsDto> GetDatabases(string sessionId)
        {
            var details = _memoryCache.Get(sessionId);
            if (details == null)
            {
                throw new Exception("Not Connected");
            }

            using var connection = await DBConnection.CreateConnection(details);
            var databases = await connection.GetDatabases();
            return new()
            {
                DataSource = connection.DataSource,
                Databases = databases,
            };
        }

        /*public async Task<DatabaseSchemaDetailsDto> GetSchemas(string sessionId, string databaseName)
        {
            var details = _memoryCache.Get(sessionId);
            if (details == null)
            {
                throw new Exception("Not Connected");
            }

            details.DatabaseName = databaseName;
            using var connection = await DBConnection.CreateConnection(details);
            var schemas = await connection.GetDatabaseSchemas();
            return new()
            {
                ServerName = connection.GetDetails().DataSource,
                DatabaseName = databaseName,
                Schemas = schemas
            };
        }*/

        public async Task<TablesDetailsDto> GetTables(string sessionId, string databaseName)
        {
            var details = _memoryCache.Get(sessionId);
            if (details == null)
            {
                throw new Exception("Not Connected");
            }

            details.DatabaseName = databaseName;
            using var connection = await DBConnection.CreateConnection(details);
            var tables = await connection.GetTables(databaseName);
            return new()
            {
                DataSource = connection.DataSource,
                DatabaseName = databaseName,
                Tables = tables
            };
        }

        public async Task<DatabaseCommandResultDto> GetTopNTableRecords(string id, string sessionId, string databaseName, string schema, string table, int? recordsNumber)
        {
            var details = _memoryCache.Get(sessionId);
            if (details == null)
            {
                throw new Exception("Not Connected");
            }

            details.DatabaseName = databaseName;
            var connection = await DBConnection.CreateConnection(details);

            var rawResult = await connection.GetTopNTableRecords(databaseName, schema, table, recordsNumber);

            var result = new DatabaseCommandResultDto()
            {
                Index = 0,
                Script = rawResult.Script,
                Id = id,
                RowCount = rawResult.Result.Rows.Count,
                Fields = Enumerable.Range(0, rawResult.Result.Columns.Count).Select(index => new DatabaseCommandResultFieldDto()
                {
                    Index = index,
                    FieldName = rawResult.Result.Columns[index].ColumnName,
                    FieldType = rawResult.Result.Columns[index].GetType().ToString(),
                    FieldDataTypeName = rawResult.Result.Columns[index].DataType.ToString(),
                }).ToList(),

                ResultJson = JsonConvert.SerializeObject(rawResult.Result.AsEnumerable().Select(r => r.ItemArray))
                //ResultJson = JsonConvert.SerializeObject(rawResult.Result.AsEnumerable().Take(Constants.MAX_ROW_BATCH).Select(r => r.ItemArray))
            };

            return result;
        }
        /*
        public async Task<DatabaseCommandResultDto> ExecuteQuery(string sessionId, Guid id, string databaseName, string query)
        {
            var details = _memoryCache.Get(sessionId);
            if (details == null)
            {
                throw new Exception("Not Connected");
            }

            details.DatabaseName = databaseName;
            var connection = await DBConnection.CreateConnection(details);
            var rawResult =  await connection.ExecuteQuery(query);

            var result = new DatabaseCommandResultDto()
            {
                Index = 0,
                Id = id,
                RowCount = rawResult.Result.Rows.Count,
                Fields = Enumerable.Range(0, rawResult.Result.Columns.Count).Select(index => new DatabaseCommandResultFieldDto()
                {
                    Index = index,
                    FieldName = rawResult.Result.Columns[index].ColumnName,
                    FieldType = rawResult.Result.Columns[index].GetType().ToString(),
                    FieldDataTypeName = rawResult.Result.Columns[index].DataType.ToString(),
                }).ToList(),

                ResultJson = JsonConvert.SerializeObject(rawResult.Result.AsEnumerable().Take(Constants.MAX_ROW_BATCH).Select(r => r.ItemArray))
            };

            if (rawResult.Result.Rows.Count > Constants.MAX_ROW_BATCH)
            {
                _backgroundTaskQueue.EnqueueTask(async (serviceScopeFactory, cancellationToken) =>
                {
                    var skipCount = Constants.MAX_ROW_BATCH;
                    var maxIndex = ((rawResult.Result.Rows.Count - Constants.MAX_ROW_BATCH  ) / Constants.MAX_ROW_BATCH ) + 1;
                    for (int i = 0; i < maxIndex && skipCount < rawResult.Result.Rows.Count; ++i)
                    {
                        var json = JsonConvert.SerializeObject(rawResult.Result.AsEnumerable()
                            .Skip(skipCount)
                            .Take(Constants.MAX_ROW_BATCH).Select(r => r.ItemArray));

                        var batch = new DatabaseCommandBatchResultDto()
                        {
                            Id = id,
                            Index = i + 1,
                            ResultJson = json
                        };

                        await _batchResultNotification.SendBatch(batch);

                        skipCount += Constants.MAX_ROW_BATCH;

                        System.Diagnostics.Debug.WriteLine(json);
                    }

                    //var json = JsonConvert.SerializeObject(rawResult.Result.AsEnumerable().Take(Constants.MAX_ROW_BATCH).Select(r => r.ItemArray))
                    // Get services
                    //using var scope = serviceScopeFactory.CreateScope();
                    //var myService = scope.ServiceProvider.GetRequiredService<IMyService>();
                    //var logger = scope.ServiceProvider.GetRequiredService<ILogger<ExampleController>>();


                    //try
                    //{
                    //    // Do something expensive

                    //}
                    //catch (Exception ex)
                    //{
                    //    throw ex;
                    //}
                });
            }

            return result;
        }
        */
    }
}


/*
   public async Task<DatabaseCommantResultDto> ExecuteQuery(string sessionId, Guid id, string databaseName, string query)
        {
            var details = _memoryCache.Get(sessionId);
            if (details == null)
            {
                throw new Exception("Not Connected");
            }

            details.DatabaseName = databaseName;
            using var connection = await DBConnection.CreateConnection(details);
            var rawResul =  await connection.ExecuteQuery(query);

            return new DatabaseCommantResultDto()
            {
                Id = id,
                Fields = Enumerable.Range(0, rawResul.Result.Columns.Count).Select(index => new DatabaseCommantResultFieldDto()
                {
                    Index = index,
                    FieldName = rawResul.Result.Columns[index].ColumnName,
                    FieldType = rawResul.Result.Columns[index].GetType().ToString(),
                    FieldDataTypeName = rawResul.Result.Columns[index].DataType.ToString(),
                }).ToList(),
                ResultJson = JsonConvert.SerializeObject(rawResul.Result.AsEnumerable().Select(r => r.ItemArray))
            };
        }
 */