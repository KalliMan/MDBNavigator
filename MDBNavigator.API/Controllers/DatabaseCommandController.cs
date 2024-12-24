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

        public DatabaseCommandController(IDBManager dbManager/*, IHubContext<BatchResultHub> hubContext*/)
        {
            _dbManager = dbManager;            
        }

        [HttpGet("tableRecords/{id}/{databaseName}/{schema}/{table}/{recordsNumber}")]
        public async Task<IActionResult> GetTopNTableRecords(string id, string databaseName, string schema, string table, int? recordsNumber)
        {
            var sessionId = Request.Headers["id"];
            if (string.IsNullOrEmpty(sessionId))
            {
                return BadRequest("The provided request header does not contain ID property.");
            }

            return Ok(await _dbManager.GetTopNTableRecords(id, sessionId!, databaseName, schema, table, recordsNumber));
        }


        //[HttpPost()]
        //public async Task<IActionResult> Execute([FromBody] CommandQueryDto value)
        //{
        //    var sessionId = GetSessionId();
        //    if (string.IsNullOrEmpty(sessionId))
        //    {
        //        return BadRequest("The provided request header does not contain ID property.");
        //    }

        //    return Ok(await _dbManager.ExecuteQuery(sessionId!, value.Id, value.DatabaseName, value.Query));
        //}
    }
}
