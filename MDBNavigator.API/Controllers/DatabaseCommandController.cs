using MDBNavigator.API.DTOs;
using MDBNavigator.BL.Services;
using Microsoft.AspNetCore.Mvc;

namespace MDBNavigator.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DatabaseCommandController: BaseApiController
    {
        private readonly IDBManager _dbManager;

        public DatabaseCommandController(IDBManager dbManager)
        {
            _dbManager = dbManager;
        }

        [HttpGet("tableRecordsScript/{connectionId}/{id}/{databaseName}/{schema}/{table}/{recordsNumber}")]
        public async Task<IActionResult> GetTopNTableRecordsScript(string connectionId, string id, string databaseName, string schema, string table, int? recordsNumber)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }

            return Ok(await _dbManager.GetTopNTableRecordsScript(id, sessionId, connectionId, databaseName, schema, table, recordsNumber));
        }


        [HttpGet("createTableScript/{connectionId}/{databaseName}/{schema}")]
        public async Task<IActionResult> GetCreateTableScript(string connectionId, string databaseName, string schema)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }

            return Ok(await _dbManager.GetCreateTableScript(sessionId, connectionId, databaseName, schema));
        }

        [HttpGet("dropTableScript/{connectionId}/{databaseName}/{schema}/{table}")]
        public async Task<IActionResult> GetDropTableScript(string connectionId, string databaseName, string schema, string table)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }

            return Ok(await _dbManager.GetDropTableScript(sessionId, connectionId, databaseName, schema, table));
        }

        [HttpPost()]
        public async Task<IActionResult> Execute([FromBody] DatabaseSQLCommandQuery value)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }

            return Ok(await _dbManager.ExecuteQuery(sessionId, value.ConnectionId, value.Id, value.DatabaseName, value.CmdQuery));
        }

        [HttpGet("procedureDefinition/{connectionId}/{databaseName}/{schema}/{name}")]
        public async Task<IActionResult> GetProcedureDefinition(string connectionId, string databaseName, string schema, string name)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }
            return Ok(await _dbManager.GetProcedureDefinition(sessionId, connectionId, databaseName, schema, name));
        }

        [HttpGet("createStoredProcedureScript/{connectionId}/{databaseName}/{schema}")]
        public async Task<IActionResult> GetCreateStoredProcedureScript(string connectionId, string databaseName, string schema)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }
            return Ok(await _dbManager.GetCreateStoredProcedureScript(sessionId, connectionId, databaseName, schema));
        }


        [HttpGet("createFunctionScript/{connectionId}/{databaseName}/{schema}")]
        public async Task<IActionResult> GetCreateFunctionScript(string connectionId, string databaseName, string schema)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }
            return Ok(await _dbManager.GetCreateFunctionProcedureScript(sessionId, connectionId, databaseName, schema));
        }

        [HttpGet("dropProcedureScript/{connectionId}/{databaseName}/{schema}/{name}")]
        public async Task<IActionResult> GetDropProcedureScript(string connectionId, string databaseName, string schema, string name)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }
            return Ok(await _dbManager.GetDropProcedureScript(sessionId, connectionId, databaseName, schema, name));
        }

        [HttpGet("viewDefinition/{connectionId}/{databaseName}/{schema}/{name}")]
        public async Task<IActionResult> GetViewDefinition(string connectionId, string databaseName, string schema, string name)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }
            return Ok(await _dbManager.GetViewDefinition(sessionId, connectionId, databaseName, schema, name));
        }


        [HttpGet("createViewScript/{connectionId}/{databaseName}/{schema}")]
        public async Task<IActionResult> GetCreateViewScript(string connectionId, string databaseName, string schema)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }
            return Ok(await _dbManager.GetCreateViewScript(sessionId, connectionId, databaseName, schema));
        }

        [HttpGet("dropViewScript/{connectionId}/{databaseName}/{schema}/{name}")]
        public async Task<IActionResult> GetDropViewScript(string connectionId, string databaseName, string schema, string name)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }
            return Ok(await _dbManager.GetDropViewScript(sessionId, connectionId, databaseName, schema, name));
        }
    }
}
