using MDBNavigator.BL.DTOs;
using Microsoft.Extensions.Logging;
using Models.Schema.Database;
using Models.Schema.Procedure;
using Models.Schema.Table;
using Models.Schema.View;

namespace MDBNavigator.BL.Services
{
    public class DatabaseMetadataService : IDatabaseMetadataService
    {
        private readonly IConnectionSessionService _connectionSessionService;
        private readonly ILogger<DatabaseMetadataService> _logger;

        public DatabaseMetadataService(IConnectionSessionService connectionSessionService, ILogger<DatabaseMetadataService> logger)
        {
            _connectionSessionService = connectionSessionService;
            _logger = logger;
        }

        public async Task<DatabasesDetailsDto> GetDatabases(string sessionId, string connectionId)
        {
            _logger.LogInformation("Getting databases for session {SessionId}, connection {ConnectionId}", sessionId, connectionId);
            await using var connection = await _connectionSessionService.CreateConnection(sessionId, connectionId);
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
            await using var connection = await _connectionSessionService.CreateConnection(sessionId, connectionId, databaseName);
            var tables = await connection.GetTables();
            return new()
            {
                ConnectionId = connectionId,
                DataSource = connection.DataSource,
                DatabaseName = databaseName,
                Tables = tables
            };
        }

        public async Task<TableDefinitionDto> GetTableDefinition(string sessionId, string connectionId, string databaseName, string schema, string table)
        {
            _logger.LogInformation("Getting table definition for session {SessionId}, connection {ConnectionId}, database {DatabaseName}, schema {Schema}, table {Table}",
                sessionId,
                connectionId,
                databaseName,
                schema,
                table);

            await using var connection = await _connectionSessionService.CreateConnection(sessionId, connectionId, databaseName);
            var tableDefinition = await connection.GetTableDefinition(schema, table);

            return new()
            {
                ConnectionId = connectionId,
                DatabaseName = databaseName,
                DatabaseSchema = schema,
                Name = table,

                Columns = tableDefinition.Columns,
                Indexes = tableDefinition.Indexes,
                Constraints = tableDefinition.Constraints
            };
        }

        public async Task<ProceduresDetailsDto> GetStoredProcedures(string sessionId, string connectionId, string databaseName)
        {
            _logger.LogInformation("Getting stored procedures for session {SessionId}, connection {ConnectionId}, database {DatabaseName}",
                sessionId,
                connectionId,
                databaseName);
            await using var connection = await _connectionSessionService.CreateConnection(sessionId, connectionId, databaseName);
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
            await using var connection = await _connectionSessionService.CreateConnection(sessionId, connectionId, databaseName);
            return connection.GetCreateStoredProcedureScript(schema);
        }

        public async Task<ProceduresDetailsDto> GetFunctions(string sessionId, string connectionId, string databaseName)
        {
            _logger.LogInformation("Getting functions for session {SessionId}, connection {ConnectionId}, database {DatabaseName}",
                sessionId,
                connectionId,
                databaseName);
            await using var connection = await _connectionSessionService.CreateConnection(sessionId, connectionId, databaseName);
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
            await using var connection = await _connectionSessionService.CreateConnection(sessionId, connectionId, databaseName);
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
            await using var connection = await _connectionSessionService.CreateConnection(sessionId, connectionId, databaseName);
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
            await using var connection = await _connectionSessionService.CreateConnection(sessionId, connectionId, databaseName);
            return connection.GetDropProcedureScript(schema, name);
        }

        public async Task<ViewDetailsDto> GetViews(string sessionId, string connectionId, string databaseName)
        {
            _logger.LogInformation("Getting views for session {SessionId}, connection {ConnectionId}, database {DatabaseName}",
                sessionId,
                connectionId,
                databaseName);
            await using var connection = await _connectionSessionService.CreateConnection(sessionId, connectionId, databaseName);
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
            await using var connection = await _connectionSessionService.CreateConnection(sessionId, connectionId, databaseName);
            return await connection.GetViewDefinition(schema, name);
        }

        public async Task<string> GetCreateViewScript(string sessionId, string connectionId, string databaseName, string schema)
        {
            _logger.LogInformation("Getting CREATE VIEW script for session {SessionId}, connection {ConnectionId}, database {DatabaseName}, schema {Schema}",
                sessionId,
                connectionId,
                databaseName,
                schema);
            await using var connection = await _connectionSessionService.CreateConnection(sessionId, connectionId, databaseName);
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
            await using var connection = await _connectionSessionService.CreateConnection(sessionId, connectionId, databaseName);
            return connection.GetDropViewScript(schema, name);
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
            await using var connection = await _connectionSessionService.CreateConnection(sessionId, connectionId, databaseName);
            return connection.GetTopNTableRecordsScript(schema, table, recordsNumber);
        }

        public async Task<string> GetCreateNewTableScript(string sessionId, string connectionId, string databaseName, string schema)
        {
            _logger.LogInformation("Getting CREATE TABLE script for session {SessionId}, connection {ConnectionId}, database {DatabaseName}, schema {Schema}",
                sessionId,
                connectionId,
                databaseName,
                schema);
            await using var connection = await _connectionSessionService.CreateConnection(sessionId, connectionId, databaseName);
            return connection.GetCreateNewTableScript(schema);
        }

        public async Task<string> GetCreateTableScript(string sessionId, string connectionId, string databaseName, string schema, string table)
        {
            _logger.LogInformation("Getting CREATE TABLE script for session {SessionId}, connection {ConnectionId}, database {DatabaseName}, schema {Schema}, table {Table}",
                sessionId,
                connectionId,
                databaseName,
                schema,
                table);

            await using var connection = await _connectionSessionService.CreateConnection(sessionId, connectionId, databaseName);
            return await connection.GetCreateTableScript(schema, table);
        }

        public async Task<string> GetDropTableScript(string sessionId, string connectionId, string databaseName, string schema, string table)
        {
            _logger.LogInformation("Getting DROP TABLE script for session {SessionId}, connection {ConnectionId}, database {DatabaseName}, schema {Schema}, table {Table}",
                sessionId,
                connectionId,
                databaseName,
                schema,
                table);
            await using var connection = await _connectionSessionService.CreateConnection(sessionId, connectionId, databaseName);
            return connection.GetDropTableScript(schema, table);
        }

        public async Task<string> GetInsertTableScript(string sessionId, string connectionId, string databaseName, string schema, string table)
        {
            _logger.LogInformation("Getting INSERT script for table for session {SessionId}, connection {ConnectionId}, database {DatabaseName}, schema {Schema}, table {Table}",
                sessionId,
                connectionId,
                databaseName,
                schema,
                table);
            await using var connection = await _connectionSessionService.CreateConnection(sessionId, connectionId, databaseName);
            return await connection.GetInsertTableScript(schema, table);
        }
    }
}