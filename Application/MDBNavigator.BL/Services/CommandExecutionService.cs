using MDBNavigator.BL.DTOs;
using Microsoft.Extensions.Logging;
using Models.Command;

namespace MDBNavigator.BL.Services
{
    public class CommandExecutionService : ICommandExecutionService
    {
        private readonly IConnectionSessionService _connectionSessionService;
        private readonly IQueryResultProcessor _queryResultProcessor;
        private readonly ILogger<CommandExecutionService> _logger;

        public CommandExecutionService(IConnectionSessionService connectionSessionService, IQueryResultProcessor queryResultProcessor, ILogger<CommandExecutionService> logger)
        {
            _connectionSessionService = connectionSessionService;
            _queryResultProcessor = queryResultProcessor;
            _logger = logger;
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

            await using var connection = await _connectionSessionService.CreateConnection(sessionId, connectionId, databaseName);
            var rawResult = await connection.GetTopNTableRecords(schema, table, recordsNumber);

            return _queryResultProcessor.ProcessQueryResult(sessionId, id, id, rawResult.Result);
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

            await using var connection = await _connectionSessionService.CreateConnection(sessionId, connectionId, databaseName);

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

            return _queryResultProcessor.ProcessQueryResult(sessionId, id, id, rawResult.Result);
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

            await using var connection = await _connectionSessionService.CreateConnection(sessionId, connectionId, databaseName);
            var rawResult = await connection.ExecuteQuery(cmdQuery);
            var commandResults = new List<DatabaseSingleCommandResultDto>();

            foreach (var res in rawResult.Results)
            {
                var single = _queryResultProcessor.ProcessQueryResult(sessionId, id, Guid.NewGuid().ToString(), res);
                commandResults.Add(single);
            }

            return new DatabaseCommandResultDto
            {
                Id = id,
                Results = commandResults
            };
        }
    }
}