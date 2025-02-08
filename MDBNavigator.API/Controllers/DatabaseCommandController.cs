using MDBNavigator.API.DTOs;
using MDBNavigator.BL.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

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

        [HttpGet("tableRecordsScript/{id}/{databaseName}/{schema}/{table}/{recordsNumber}")]
        public async Task<IActionResult> GetTopNTableRecordsScript(string id, string databaseName, string schema, string table, int? recordsNumber)
        {
            var sessionId = Request.Headers["id"];
            if (string.IsNullOrEmpty(sessionId))
            {
                return BadRequest("The provided request header does not contain ID property.");
            }

            return Ok(await _dbManager.GetTopNTableRecordsScript(id, sessionId!, databaseName, schema, table, recordsNumber));
        }


        [HttpGet("createTableScript/{databaseName}/{schema}")]
        public async Task<IActionResult> GetCreateTableScript(string databaseName, string schema)
        {
            var sessionId = Request.Headers["id"];
            if (string.IsNullOrEmpty(sessionId))
            {
                return BadRequest("The provided request header does not contain ID property.");
            }

            return Ok(await _dbManager.GetCreateTableScript(sessionId!, databaseName, schema));
        }

        [HttpGet("dropTableScript/{databaseName}/{schema}/{table}")]
        public async Task<IActionResult> GetDropTableScript(string databaseName, string schema, string table)
        {
            var sessionId = Request.Headers["id"];
            if (string.IsNullOrEmpty(sessionId))
            {
                return BadRequest("The provided request header does not contain ID property.");
            }

            return Ok(await _dbManager.GetDropTableScript(sessionId!, databaseName, schema, table));
        }

        [HttpPost()]
        public async Task<IActionResult> Execute([FromBody] DatabaseSQLCommandQuery value)
        {
            var sessionId = GetSessionId();
            if (string.IsNullOrEmpty(sessionId))
            {
                return BadRequest("The provided request header does not contain ID property.");
            }

            return Ok(await _dbManager.ExecuteQuery(sessionId!, value.Id, value.DatabaseName, value.CmdQuery));
        }

        [HttpGet("procedureDefinition/{databaseName}/{schema}/{name}")]
        public async Task<IActionResult> GetProcedureDefinition(string databaseName, string schema, string name)
        {
            var sessionId = GetSessionId();
            if (string.IsNullOrEmpty(sessionId))
            {
                return BadRequest("The provided request header does not contain ID property.");
            }
            return Ok(await _dbManager.GetProcedureDefinition(sessionId!, databaseName, schema, name));
        }
    }
}
