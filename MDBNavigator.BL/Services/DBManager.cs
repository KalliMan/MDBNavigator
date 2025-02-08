﻿using MDBNavigator.BL.Cache;
using MDBNavigator.BL.Common;
using MDBNavigator.BL.BatchCommandResultHub;
using MDBNavigator.DAL;
using Newtonsoft.Json;
using System.Data;
using MDBNavigator.BL.BackgroundTaskQueue;
using Models.Schema;
using Models.Command;
using Models.Connect;

namespace MDBNavigator.BL.Services
{
    public class DBManager : IDBManager
    {
        private readonly IConnectionSettingsMemoryCache _memoryCache;
        private readonly IBatchCommandResultHubProxy _batchCommandResultHubProxy;
        private readonly IBackgroundTaskQueue _backgroundTaskQueue;

        public DBManager(IConnectionSettingsMemoryCache memoryCache, IBackgroundTaskQueue backgroundTaskQueue, IBatchCommandResultHubProxy batchCommandResultHubProxy)
        {
            _memoryCache = memoryCache;
            _batchCommandResultHubProxy = batchCommandResultHubProxy;
            _backgroundTaskQueue = backgroundTaskQueue;
        }

        public async Task<bool> Connect(string sessionId, ConnectionSettings details)
        {
            _memoryCache.Remove(sessionId);

            using var connection = await DBConnection.CreateConnection(details);            
            _memoryCache.Set(sessionId, details);
            return true;
        }
        
        public async Task<DatabasesDetailsDto> GetDatabases(string sessionId)
        {
            var connection = await CreateConnection(sessionId);
            var databases = await connection.GetDatabases();
            return new()
            {
                DataSource = connection.DataSource,
                Databases = databases,
            };
        }

        public async Task<TablesDetailsDto> GetTables(string sessionId, string databaseName)
        {
            var connection = await CreateConnection(sessionId, databaseName);
            var tables = await connection.GetTables();
            return new()
            {
                DataSource = connection.DataSource,
                DatabaseName = databaseName,
                Tables = tables
            };
        }

        public async Task<ProceduresDetailsDto> GetStoredProcedures(string sessionId, string databaseName)
        {
            var connection = await CreateConnection(sessionId, databaseName);
            var procedures = await connection.GetStoredProcedures();
            return new()
            {
                DataSource = connection.DataSource,
                DatabaseName = databaseName,
                Procedures = procedures
            };
        }

        public async Task<ProceduresDetailsDto> GetFunctions(string sessionId, string databaseName)
        {
            var connection = await CreateConnection(sessionId, databaseName);
            var functions = await connection.GetFunctions();
            return new()
            {
                DataSource = connection.DataSource,
                DatabaseName = databaseName,
                Procedures = functions
            };
        }

        public async Task<string> GetProcedureDefinition(string sessionId, string databaseName, string schema, string name)
        {
            var connection = await CreateConnection(sessionId, databaseName);
            return await connection.GetProcedureDefinition(schema, name);
        }

        public async Task<DatabaseCommandResultDto> GetTopNTableRecords(string id, string sessionId, string databaseName, string schema, string table, int? recordsNumber)
        {
            var connection = await CreateConnection(sessionId, databaseName);

            var rawResult = await connection.GetTopNTableRecords(schema, table, recordsNumber);

            var result = new DatabaseCommandResultDto()
            {
                Id = id,
                RecordsAffected = rawResult.RecordsAffected,
                RowCount = rawResult.Result.Rows.Count,
                Fields = Enumerable.Range(0, rawResult.Result.Columns.Count).Select(index => new DatabaseCommandResultFieldDto()
                {
                    Index = index,
                    FieldName = rawResult.Result.Columns[index].ColumnName,
                    FieldType = rawResult.Result.Columns[index].GetType().ToString(),
                    FieldDataTypeName = rawResult.Result.Columns[index].DataType.ToString(),
                }).ToList(),

                ResultJson = JsonConvert.SerializeObject(rawResult.Result.AsEnumerable().Select(r => r.ItemArray))
            };

            return result;
        }

        public async Task<string> GetTopNTableRecordsScript(string id, string sessionId, string databaseName, string schema, string table, int? recordsNumber)
        {
            var connection = await CreateConnection(sessionId, databaseName);
            return connection.GetTopNTableRecordsScript(schema, table, recordsNumber);
        }

        public async Task<string> GetCreateTableScript(string sessionId, string databaseName, string schema)
        {
            var connection = await CreateConnection(sessionId, databaseName);
            return connection.GetCreateTableScript(schema);
        }

        public async Task<string> GetDropTableScript(string sessionId, string databaseName, string schema, string table)
        {
            var connection = await CreateConnection(sessionId, databaseName);
            return connection.GetDropTableScript(schema, table);
        }

        public async Task<DatabaseCommandResultDto> ExecuteQuery(string sessionId, string id, string databaseName, string cmdQuery)
        {
            var connection = await CreateConnection(sessionId, databaseName);

            var rawResult = await connection.ExecuteQuery(cmdQuery);

            var result = new DatabaseCommandResultDto()
            {
                Id = id,
                RecordsAffected = rawResult.RecordsAffected,
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
                    var maxIndex = ((rawResult.Result.Rows.Count - Constants.MAX_ROW_BATCH) / Constants.MAX_ROW_BATCH) + 1;
                    for (int i = 0; i < maxIndex && skipCount < rawResult.Result.Rows.Count; ++i)
                    {
                        var json = JsonConvert.SerializeObject(rawResult.Result.AsEnumerable()
                            .Skip(skipCount)
                            .Take(Constants.MAX_ROW_BATCH).Select(r => r.ItemArray));

                        var batch = new DatabaseCommandBatchResultDto()
                        {
                            Id = id,
                            Index = i,
                            ResultJson = json
                        };

                        await _batchCommandResultHubProxy.SendBatchCommandResult(batch, sessionId);

                        skipCount += Constants.MAX_ROW_BATCH;

                        System.Diagnostics.Debug.WriteLine(json);
                    }
                });
            }

            return result;
        }

        private async Task<DBConnection> CreateConnection(string sessionId, string? databaseName = null)
        {
            var details = _memoryCache.Get(sessionId);
            if (details == null)
            {
                throw new Exception("Not Connected");
            }

            if (!string.IsNullOrEmpty(databaseName))
            {
                details.DatabaseName = databaseName;
            }

            return await DBConnection.CreateConnection(details);
        }
    }
}
