using MDBNavigator.BL.BackgroundTaskQueue;
using MDBNavigator.BL.BatchCommandResultHub;
using MDBNavigator.BL.Cache;
using MDBNavigator.BL.Common;
using MDBNavigator.BL.DTOs;
using MDBNavigator.BL.Exceptions;
using MDBNavigator.DAL;
using MDBNavigator.DAL.Enums;
using Microsoft.Extensions.Logging;
using Models.Command;
using Models.Connect;
using Models.Schema;
using Newtonsoft.Json;
using System.Data;

namespace MDBNavigator.BL.Services
{
    public class DBManager : IDBManager
    {
        private readonly IConnectionSettingsMemoryCache _memoryCache;
        private readonly IBatchCommandResultHubProxy _batchCommandResultHubProxy;
        private readonly IBackgroundTaskQueue _backgroundTaskQueue;
        private readonly ILogger<DBManager> _logger;

        public DBManager(IConnectionSettingsMemoryCache memoryCache, IBackgroundTaskQueue backgroundTaskQueue, IBatchCommandResultHubProxy batchCommandResultHubProxy, ILogger<DBManager> logger)
        {
            _memoryCache = memoryCache;
            _batchCommandResultHubProxy = batchCommandResultHubProxy;
            _backgroundTaskQueue = backgroundTaskQueue;
            _logger = logger;
        }

        public async Task<ConnectedResultDto> Connect(string sessionId, ConnectionSettings connectionSettings)
        {
            _logger.LogInformation("Connecting session {SessionId} to {ServerName}:{Port} (server type: {ServerType})",
                sessionId,
                connectionSettings.ServerName,
                connectionSettings.Port,
                connectionSettings.ServerType);
            try
            {
                return await ConnectInt(sessionId, Guid.NewGuid().ToString(), connectionSettings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Connection failed for session {SessionId} to {ServerName}:{Port} (server type: {ServerType})",
                    sessionId,
                    connectionSettings.ServerName,
                    connectionSettings.Port,
                    connectionSettings.ServerType);
                throw new ConnectionFailedException("Connection failed!", ex);
            }
        }

        public async Task<ConnectedResultDto> Reconnect(string sessionId, string connectionId, ConnectionSettings connectionSettings)
        {
            _logger.LogInformation("Reconnecting session {SessionId}, connection {ConnectionId} to {ServerName}:{Port} (server type: {ServerType})",
                sessionId,
                connectionId,
                connectionSettings.ServerName,
                connectionSettings.Port,
                connectionSettings.ServerType);
            try
            {
                return await ConnectInt(sessionId, connectionId, connectionSettings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Reconnection failed for session {SessionId}, connection {ConnectionId} to {ServerName}:{Port} (server type: {ServerType})",
                    sessionId,
                    connectionId,
                    connectionSettings.ServerName,
                    connectionSettings.Port,
                    connectionSettings.ServerType);
                throw new ConnectionFailedException("Reconnection failed!", ex);
            }
        }

        private async Task<ConnectedResultDto> ConnectInt(string sessionId, string connectionId, ConnectionSettings connectionSettings)
        {
            var cachekey = GetSessionConnectionID(sessionId, connectionId);

            await using var connection = await DBConnection.CreateConnection(connectionSettings);
            _memoryCache[cachekey] = connectionSettings;

            var serverType = connectionSettings.ServerType switch
            {
                "PostgreSQL" => ServerType.PostgreSQL,
                "MS SQL Server" => ServerType.MSSQLServer,
                _ => ServerType.None
            };

            return new()
            {
                ConnectionId = connectionId,
                ConnectionName = $"{connectionSettings.ServerName}:{connectionSettings.Port}",
                ServerName = connectionSettings.ServerName,
                Port = connectionSettings.Port,
                ServerType = serverType,
                UserName = connectionSettings.UserName,
            };
        }

        public void Disconnect(string sessionId, string connectionId)
        {
            _logger.LogInformation("Disconnecting session {SessionId}, connection {ConnectionId}", sessionId, connectionId);
            var cachekey = GetSessionConnectionID(sessionId, connectionId);
            _memoryCache.Remove(cachekey);
        }

        public async Task<DatabasesDetailsDto> GetDatabases(string sessionId, string connectionId)
        {
            _logger.LogInformation("Getting databases for session {SessionId}, connection {ConnectionId}", sessionId, connectionId);
            var connection = await CreateConnection(sessionId, connectionId);
            var databases = await connection.GetDatabases();
            return new()
            {
                ConnectionId = connectionId,
                DataSource = connection.DataSource,
                Databases = databases,
            };
        }

        public async Task<TablesDetailsDto> GetTables(string sessionId, string connectionId, string databaseName)
        {
            _logger.LogInformation("Getting tables for session {SessionId}, connection {ConnectionId}, database {DatabaseName}",
                sessionId,
                connectionId,
                databaseName);
            await using var connection = await CreateConnection(sessionId, connectionId, databaseName);
            var tables = await connection.GetTables();
            return new()
            {
                ConnectionId = connectionId,
                DataSource = connection.DataSource,
                DatabaseName = databaseName,
                Tables = tables
            };
        }

        public async Task<ProceduresDetailsDto> GetStoredProcedures(string sessionId, string connectionId, string databaseName)
        {
            _logger.LogInformation("Getting stored procedures for session {SessionId}, connection {ConnectionId}, database {DatabaseName}",
                sessionId,
                connectionId,
                databaseName);
            await using var connection = await CreateConnection(sessionId, connectionId, databaseName);
            var procedures = await connection.GetStoredProcedures();
            return new()
            {
                ConnectionId = connectionId,
                DataSource = connection.DataSource,
                DatabaseName = databaseName,
                Procedures = procedures
            };
        }

        public async Task<string> GetCreateStoredProcedureScript(string sessionId, string connectionId, string databaseName, string schema)
        {
            _logger.LogInformation("Getting CREATE PROCEDURE script for session {SessionId}, connection {ConnectionId}, database {DatabaseName}, schema {Schema}",
                sessionId,
                connectionId,
                databaseName,
                schema);
            await using var connection = await CreateConnection(sessionId, connectionId, databaseName);
            return connection.GetCreateStoredProcedureScript(schema);
        }

        public async Task<ProceduresDetailsDto> GetFunctions(string sessionId, string connectionId, string databaseName)
        {
            _logger.LogInformation("Getting functions for session {SessionId}, connection {ConnectionId}, database {DatabaseName}",
                sessionId,
                connectionId,
                databaseName);
            await using var connection = await CreateConnection(sessionId, connectionId, databaseName);
            var functions = await connection.GetFunctions();
            return new()
            {
                ConnectionId = connectionId,
                DataSource = connection.DataSource,
                DatabaseName = databaseName,
                Procedures = functions
            };
        }

        public async Task<string> GetCreateFunctionProcedureScript(string sessionId, string connectionId, string databaseName, string schema)
        {
            _logger.LogInformation("Getting CREATE FUNCTION script for session {SessionId}, connection {ConnectionId}, database {DatabaseName}, schema {Schema}",
                sessionId,
                connectionId,
                databaseName,
                schema);
            await using var connection = await CreateConnection(sessionId, connectionId, databaseName);
            return connection.GetCreateFunctionProcedureScript(schema);
        }

        public async Task<string> GetProcedureDefinition(string sessionId, string connectionId, string databaseName, string schema, string name)
        {
            _logger.LogInformation("Getting procedure definition for session {SessionId}, connection {ConnectionId}, database {DatabaseName}, schema {Schema}, name {Name}",
                sessionId,
                connectionId,
                databaseName,
                schema,
                name);
            await using var connection = await CreateConnection(sessionId, connectionId, databaseName);
            return await connection.GetProcedureDefinition(schema, name);
        }

        public async Task<string> GetDropProcedureScript(string sessionId, string connectionId, string databaseName, string schema, string name)
        {
            _logger.LogInformation("Getting DROP PROCEDURE script for session {SessionId}, connection {ConnectionId}, database {DatabaseName}, schema {Schema}, name {Name}",
                sessionId,
                connectionId,
                databaseName,
                schema,
                name);
            await using var connection = await CreateConnection(sessionId, connectionId, databaseName);
            return connection.GetDropProcedureScript(schema, name);
        }

        public async Task<ViewDetailsDto> GetViews(string sessionId, string connectionId, string databaseName)
        {
            _logger.LogInformation("Getting views for session {SessionId}, connection {ConnectionId}, database {DatabaseName}",
                sessionId,
                connectionId,
                databaseName);
            await using var connection = await CreateConnection(sessionId, connectionId, databaseName);
            var views = await connection.GetViews();
            return new()
            {
                ConnectionId = connectionId,
                DataSource = connection.DataSource,
                DatabaseName = databaseName,
                Views = views
            };
        }

        public async Task<string> GetViewDefinition(string sessionId, string connectionId, string databaseName, string schema, string name)
        {
            _logger.LogInformation("Getting view definition for session {SessionId}, connection {ConnectionId}, database {DatabaseName}, schema {Schema}, name {Name}",
                sessionId,
                connectionId,
                databaseName,
                schema,
                name);
            await using var connection = await CreateConnection(sessionId, connectionId, databaseName);
            return await connection.GetViewDefinition(schema, name);
        }

        public async Task<string> GetCreateViewScript(string sessionId, string connectionId, string databaseName, string schema)
        {
            _logger.LogInformation("Getting CREATE VIEW script for session {SessionId}, connection {ConnectionId}, database {DatabaseName}, schema {Schema}",
                sessionId,
                connectionId,
                databaseName,
                schema);
            await using var connection = await CreateConnection(sessionId, connectionId, databaseName);
            return connection.GetCreateViewScript(schema);
        }
        public async Task<string> GetDropViewScript(string sessionId, string connectionId, string databaseName, string schema, string name)
        {
            _logger.LogInformation("Getting DROP VIEW script for session {SessionId}, connection {ConnectionId}, database {DatabaseName}, schema {Schema}, name {Name}",
                sessionId,
                connectionId,
                databaseName,
                schema,
                name);
            await using var connection = await CreateConnection(sessionId, connectionId, databaseName);
            return connection.GetDropViewScript(schema, name);
        }

        public async Task<DatabaseSingleCommandResultDto> GetTopNTableRecords(string id, string sessionId, string connectionId, string databaseName, string schema, string table, int? recordsNumber)
        {
            _logger.LogInformation("Getting top {RecordsNumber} records for session {SessionId}, connection {ConnectionId}, database {DatabaseName}, schema {Schema}, table {Table}, command id {CommandId}",
                recordsNumber,
                sessionId,
                connectionId,
                databaseName,
                schema,
                table,
                id);
            await using var connection = await CreateConnection(sessionId, connectionId, databaseName);

            var rawResult = await connection.GetTopNTableRecords(schema, table, recordsNumber);

            var result = new DatabaseSingleCommandResultDto()
            {
                Id = id,
                //CommandIndex = 0,
                RecordsAffected = rawResult.RecordsAffected,
                RowCount = rawResult.Result.Rows.Count,
                Fields = Enumerable.Range(0, rawResult.Result.Columns.Count).Select(index => new DatabaseCommandResultFieldDto()
                {
                    Index = index,
                    FieldName = rawResult.Result.Columns[index].ColumnName,
                    FieldType = rawResult.Result.Columns[index].DataType.Name,
                    FieldDataTypeName = rawResult.Result.Columns[index].DataType.FullName ?? rawResult.Result.Columns[index].DataType.ToString(),
                }).ToList(),

                ResultJson = JsonConvert.SerializeObject(rawResult.Result.AsEnumerable().Select(r => r.ItemArray))
            };

            return result;
        }

        public async Task<string> GetTopNTableRecordsScript(string id, string sessionId, string connectionId, string databaseName, string schema, string table, int? recordsNumber)
        {
            _logger.LogInformation("Getting SELECT script for top {RecordsNumber} records for session {SessionId}, connection {ConnectionId}, database {DatabaseName}, schema {Schema}, table {Table}, command id {CommandId}",
                recordsNumber,
                sessionId,
                connectionId,
                databaseName,
                schema,
                table,
                id);
            await using var connection = await CreateConnection(sessionId, connectionId, databaseName);
            return connection.GetTopNTableRecordsScript(schema, table, recordsNumber);
        }

        public async Task<string> GetCreateTableScript(string sessionId, string connectionId, string databaseName, string schema)
        {
            _logger.LogInformation("Getting CREATE TABLE script for session {SessionId}, connection {ConnectionId}, database {DatabaseName}, schema {Schema}",
                sessionId,
                connectionId,
                databaseName,
                schema);
            await using var connection = await CreateConnection(sessionId, connectionId, databaseName);
            return connection.GetCreateTableScript(schema);
        }

        public async Task<string> GetDropTableScript(string sessionId, string connectionId, string databaseName, string schema, string table)
        {
            _logger.LogInformation("Getting DROP TABLE script for session {SessionId}, connection {ConnectionId}, database {DatabaseName}, schema {Schema}, table {Table}",
                sessionId,
                connectionId,
                databaseName,
                schema,
                table);
            await using var connection = await CreateConnection(sessionId, connectionId, databaseName);
            return connection.GetDropTableScript(schema, table);
        }

        public async Task<DatabaseSingleCommandResultDto> ExecuteSingleQuery(string sessionId, string connectionId, string id, string databaseName, string cmdQuery)
        {
            _logger.LogInformation("Executing query for session {SessionId}, connection {ConnectionId}, database {DatabaseName}, command id {CommandId}. Query length: {QueryLength}",
                sessionId,
                connectionId,
                databaseName,
                id,
                cmdQuery?.Length ?? 0);

            if (string.IsNullOrEmpty(cmdQuery))
            {
                throw new ArgumentException("Command query is null or empty!", nameof(cmdQuery));
            }

            await using var connection = await CreateConnection(sessionId, connectionId, databaseName);

            var rawResult = await connection.ExecuteSingleQuery(cmdQuery);
            if (rawResult == null || rawResult.Result == null)
            {
                return new DatabaseSingleCommandResultDto()
                {
                    Id = id,
                    RecordsAffected = 0,
                    RowCount = 0,
                    Fields = Array.Empty<DatabaseCommandResultFieldDto>(),
                    ResultJson = "[]"
                };
            }

            return ProcessQueryResult(sessionId, id, rawResult.Result);
        }

        public async Task<DatabaseCommandResultDto> ExecuteQuery(string sessionId, string connectionId, string id, string databaseName, string cmdQuery)
        {
            _logger.LogInformation("Executing query for session {SessionId}, connection {ConnectionId}, database {DatabaseName}, command id {CommandId}. Query length: {QueryLength}",
                sessionId,
                connectionId,
                databaseName,
                id,
                cmdQuery?.Length ?? 0);

            if (string.IsNullOrEmpty(cmdQuery))
            {
                throw new ArgumentException("Command query is null or empty!", nameof(cmdQuery));
            }

            await using var connection = await CreateConnection(sessionId, connectionId, databaseName);
            var rawResult = await connection.ExecuteQuery(cmdQuery);
            var commandResults = new List<DatabaseSingleCommandResultDto>();

            int queryIndex = 0;
            foreach (var res in rawResult.Results)
            {
                var single = ProcessQueryResult(sessionId, id, res);
                commandResults.Add(single);
                queryIndex++;
            }

            var result = new DatabaseCommandResultDto
            {
                Id = id,
                Results = commandResults
            };

            return result;
        }

        private DatabaseSingleCommandResultDto ProcessQueryResult(string sessionId, string commandId, DataTable rawResult)
        {
            var databaseSingleCommandResultDto = new DatabaseSingleCommandResultDto()
            {
                Id = Guid.NewGuid().ToString(),
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
                _backgroundTaskQueue.EnqueueTask(async (serviceScopeFactory, cancellationToken) =>
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

        private async Task<DBConnection> CreateConnection(string sessionId, string connectionId, string? databaseName = null)
        {
            _logger.LogInformation("Creating DB connection for session {SessionId}, connection {ConnectionId}, database {DatabaseName}",
                sessionId,
                connectionId,
                databaseName ?? "<default>");
            var result = _memoryCache.TryGetValue(GetSessionConnectionID(sessionId, connectionId), out var details);
            if (!result || details == null)
            {
                _logger.LogWarning("Attempt to create DB connection for not connected session {SessionId}, connection {ConnectionId}",
                    sessionId,
                    connectionId);
                throw new NotConnectedException("Not Connected! Please reconnect.");
            }

            return await DBConnection.CreateConnection(details, databaseName);
        }

        private static string GetSessionConnectionID(string sessionId, string connectionId)
            => $"{sessionId}_{connectionId}";
    }
}
