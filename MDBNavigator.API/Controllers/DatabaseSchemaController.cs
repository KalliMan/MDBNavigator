using MDBNavigator.BL.Services;
using Microsoft.AspNetCore.Mvc;

namespace MDBNavigator.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DatabaseSchemaController : BaseApiController
    {
        IDBManager _dbManager;
        public DatabaseSchemaController(IDBManager dbManager)
        {
            _dbManager = dbManager;
        }

        [HttpGet("databases/{connectionId}")]
        public async Task<IActionResult> Databases(string connectionId)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }

            return Ok(await _dbManager.GetDatabases(sessionId, connectionId));
        }

        [HttpGet("tables/{connectionId}/{databaseName}")]
        public async Task<IActionResult> Tables(string connectionId, string databaseName)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }

            return Ok(await _dbManager.GetTables(sessionId, connectionId, databaseName));
        }

        [HttpGet("tableDefinition/{connectionId}/{databaseName}/{schema}/{table}")]
        public async Task<IActionResult> TableDefinition(string connectionId, string databaseName, string schema, string table)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }

            return Ok(await _dbManager.GetTableDefinition(sessionId, connectionId, databaseName, schema, table));
        }


        [HttpGet("storedProcedures/{connectionId}/{databaseName}")]
        public async Task<IActionResult> StoredProcedures(string connectionId, string databaseName)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }

            return Ok(await _dbManager.GetStoredProcedures(sessionId, connectionId, databaseName));
        }

        [HttpGet("functions/{connectionId}/{databaseName}")]
        public async Task<IActionResult> Functions(string connectionId, string databaseName)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }

            return Ok(await _dbManager.GetFunctions(sessionId, connectionId, databaseName));
        }

        [HttpGet("views/{connectionId}/{databaseName}")]
        public async Task<IActionResult> Views(string connectionId, string databaseName)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }

            return Ok(await _dbManager.GetViews(sessionId, connectionId, databaseName));
        }
    }
}
