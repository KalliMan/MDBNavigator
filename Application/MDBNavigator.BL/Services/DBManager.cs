using MDBNavigator.BL.DTOs;
using MDBNavigator.BL.Exceptions;
using Microsoft.Extensions.Logging;
using Models.Command;
using Models.Connect;
using Models.Schema.Database;
using Models.Schema.Procedure;
using Models.Schema.Table;
using Models.Schema.View;

namespace MDBNavigator.BL.Services
{
    public class DBManager : IDBManager
    {
        private readonly IConnectionSessionService _connectionSessionService;
        private readonly IDatabaseMetadataService _databaseMetadataService;
        private readonly ICommandExecutionService _commandExecutionService;
        private readonly ILogger<DBManager> _logger;

        public DBManager(
            IConnectionSessionService connectionSessionService,
            IDatabaseMetadataService databaseMetadataService,
            ICommandExecutionService commandExecutionService,
            ILogger<DBManager> logger)
        {
            _connectionSessionService = connectionSessionService;
            _databaseMetadataService = databaseMetadataService;
            _commandExecutionService = commandExecutionService;
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
                return await _connectionSessionService.Connect(sessionId, Guid.NewGuid().ToString(), connectionSettings);
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
                return await _connectionSessionService.Connect(sessionId, connectionId, connectionSettings);
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

        public void Disconnect(string sessionId, string connectionId)
            => _connectionSessionService.Disconnect(sessionId, connectionId);

        public Task<DatabasesDetailsDto> GetDatabases(string sessionId, string connectionId)
            => _databaseMetadataService.GetDatabases(sessionId, connectionId);

        public Task<TablesDetailsDto> GetTables(string sessionId, string connectionId, string databaseName)
            => _databaseMetadataService.GetTables(sessionId, connectionId, databaseName);

        public Task<TableDefinitionDto> GetTableDefinition(string sessionId, string connectionId, string databaseName, string schema, string table)
            => _databaseMetadataService.GetTableDefinition(sessionId, connectionId, databaseName, schema, table);

        public Task<ProceduresDetailsDto> GetStoredProcedures(string sessionId, string connectionId, string databaseName)
            => _databaseMetadataService.GetStoredProcedures(sessionId, connectionId, databaseName);

        public Task<ProceduresDetailsDto> GetFunctions(string sessionId, string connectionId, string databaseName)
            => _databaseMetadataService.GetFunctions(sessionId, connectionId, databaseName);

        public Task<string> GetProcedureDefinition(string sessionId, string connectionId, string databaseName, string schema, string name)
            => _databaseMetadataService.GetProcedureDefinition(sessionId, connectionId, databaseName, schema, name);

        public Task<string> GetCreateStoredProcedureScript(string sessionId, string connectionId, string databaseName, string schema)
            => _databaseMetadataService.GetCreateStoredProcedureScript(sessionId, connectionId, databaseName, schema);

        public Task<string> GetCreateFunctionProcedureScript(string sessionId, string connectionId, string databaseName, string schema)
            => _databaseMetadataService.GetCreateFunctionProcedureScript(sessionId, connectionId, databaseName, schema);

        public Task<string> GetDropProcedureScript(string sessionId, string connectionId, string databaseName, string schema, string name)
            => _databaseMetadataService.GetDropProcedureScript(sessionId, connectionId, databaseName, schema, name);

        public Task<ViewDetailsDto> GetViews(string sessionId, string connectionId, string databaseName)
            => _databaseMetadataService.GetViews(sessionId, connectionId, databaseName);

        public Task<string> GetViewDefinition(string sessionId, string connectionId, string databaseName, string schema, string name)
            => _databaseMetadataService.GetViewDefinition(sessionId, connectionId, databaseName, schema, name);

        public Task<string> GetCreateViewScript(string sessionId, string connectionId, string databaseName, string schema)
            => _databaseMetadataService.GetCreateViewScript(sessionId, connectionId, databaseName, schema);

        public Task<string> GetDropViewScript(string sessionId, string connectionId, string databaseName, string schema, string name)
            => _databaseMetadataService.GetDropViewScript(sessionId, connectionId, databaseName, schema, name);

        public Task<DatabaseSingleCommandResultDto> GetTopNTableRecords(string id, string sessionId, string connectionId, string databaseName, string schema, string table, int? recordsNumber)
            => _commandExecutionService.GetTopNTableRecords(id, sessionId, connectionId, databaseName, schema, table, recordsNumber);

        public Task<string> GetTopNTableRecordsScript(string id, string sessionId, string connectionId, string databaseName, string schema, string table, int? recordsNumber)
            => _databaseMetadataService.GetTopNTableRecordsScript(id, sessionId, connectionId, databaseName, schema, table, recordsNumber);

        public Task<string> GetCreateNewTableScript(string sessionId, string connectionId, string databaseName, string schema)
            => _databaseMetadataService.GetCreateNewTableScript(sessionId, connectionId, databaseName, schema);

        public Task<string> GetCreateTableScript(string sessionId, string connectionId, string databaseName, string schema, string table)
            => _databaseMetadataService.GetCreateTableScript(sessionId, connectionId, databaseName, schema, table);

        public Task<string> GetDropTableScript(string sessionId, string connectionId, string databaseName, string schema, string table)
            => _databaseMetadataService.GetDropTableScript(sessionId, connectionId, databaseName, schema, table);

        public Task<string> GetInsertTableScript(string sessionId, string connectionId, string databaseName, string schema, string table)
            => _databaseMetadataService.GetInsertTableScript(sessionId, connectionId, databaseName, schema, table);

        public Task<DatabaseSingleCommandResultDto> ExecuteSingleQuery(string sessionId, string connectionId, string id, string databaseName, string cmdQuery)
            => _commandExecutionService.ExecuteSingleQuery(sessionId, connectionId, id, databaseName, cmdQuery);

        public Task<DatabaseCommandResultDto> ExecuteQuery(string sessionId, string connectionId, string id, string databaseName, string cmdQuery)
            => _commandExecutionService.ExecuteQuery(sessionId, connectionId, id, databaseName, cmdQuery);
    }
}
