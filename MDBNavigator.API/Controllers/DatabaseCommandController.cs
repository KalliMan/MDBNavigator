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
            var sessionId = Request.Headers["id"];
            if (string.IsNullOrEmpty(sessionId))
            {
                return BadRequest("The provided request header does not contain ID property.");
            }

            return Ok(await _dbManager.GetTopNTableRecordsScript(id, sessionId!, connectionId, databaseName, schema, table, recordsNumber));
        }


        [HttpGet("createTableScript/{connectionId}/{databaseName}/{schema}")]
        public async Task<IActionResult> GetCreateTableScript(string connectionId, string databaseName, string schema)
        {
            var sessionId = Request.Headers["id"];
            if (string.IsNullOrEmpty(sessionId))
            {
                return BadRequest("The provided request header does not contain ID property.");
            }

            return Ok(await _dbManager.GetCreateTableScript(sessionId!, connectionId, databaseName, schema));
        }

        [HttpGet("dropTableScript/{connectionId}/{databaseName}/{schema}/{table}")]
        public async Task<IActionResult> GetDropTableScript(string connectionId, string databaseName, string schema, string table)
        {
            var sessionId = Request.Headers["id"];
            if (string.IsNullOrEmpty(sessionId))
            {
                return BadRequest("The provided request header does not contain ID property.");
            }

            return Ok(await _dbManager.GetDropTableScript(sessionId!, connectionId, databaseName, schema, table));
        }

        [HttpPost()]
        public async Task<IActionResult> Execute([FromBody] DatabaseSQLCommandQuery value)
        {
            var sessionId = GetSessionId();
            if (string.IsNullOrEmpty(sessionId))
            {
                return BadRequest("The provided request header does not contain ID property.");
            }

            return Ok(await _dbManager.ExecuteQuery(sessionId!, value.ConnectionId, value.Id, value.DatabaseName, value.CmdQuery));
        }

        [HttpGet("procedureDefinition/{connectionId}/{databaseName}/{schema}/{name}")]
        public async Task<IActionResult> GetProcedureDefinition(string connectionId, string databaseName, string schema, string name)
        {
            var sessionId = GetSessionId();
            if (string.IsNullOrEmpty(sessionId))
            {
                return BadRequest("The provided request header does not contain ID property.");
            }
            return Ok(await _dbManager.GetProcedureDefinition(sessionId!, connectionId, databaseName, schema, name));
        }
    }
}
