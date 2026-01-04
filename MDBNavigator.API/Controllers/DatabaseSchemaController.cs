using AutoMapper;
using MDBNavigator.BL.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860
namespace MDBNavigator.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DatabaseSchemaController : BaseApiController
    {
        IMemoryCache _memoryCache;
        IMapper _mapper;
        IDBManager _dbManager;
        public DatabaseSchemaController(IMemoryCache memoryCache, IMapper mapper, IDBManager dbManager)
        {
            _memoryCache = memoryCache;
            _mapper = mapper;
            _dbManager = dbManager;
        }

        [HttpGet("databases/{connectionId}")]
        public async Task<IActionResult> Databases(string connectionId)
        {
            var sessionId = GetSessionId();
            if (string.IsNullOrEmpty(sessionId))
            {
                return BadRequest("The provided request header does not contain ID property.");
            }

            return Ok(await _dbManager.GetDatabases(sessionId!, connectionId));
        }

        [HttpGet("tables/{connectionId}/{databaseName}")]
        public async Task<IActionResult> Tables(string connectionId, string databaseName)
        {
            var sessionId = GetSessionId();
            if (string.IsNullOrEmpty(sessionId))
            {
                return BadRequest("The provided request header does not contain ID property.");
            }

            return Ok(await _dbManager.GetTables(sessionId!, connectionId, databaseName));
        }

        [HttpGet("storedProcedures/{connectionId}/{databaseName}")]
        public async Task<IActionResult> StoredProcedures(string connectionId, string databaseName)
        {
            var sessionId = GetSessionId();
            if (string.IsNullOrEmpty(sessionId))
            {
                return BadRequest("The provided request header does not contain ID property.");
            }

            return Ok(await _dbManager.GetStoredProcedures(sessionId!, connectionId, databaseName));
        }

        [HttpGet("functions/{connectionId}/{databaseName}")]
        public async Task<IActionResult> Functions(string connectionId, string databaseName)
        {
            var sessionId = GetSessionId();
            if (string.IsNullOrEmpty(sessionId))
            {
                return BadRequest("The provided request header does not contain ID property.");
            }

            return Ok(await _dbManager.GetFunctions(sessionId!, connectionId, databaseName));
        }

        [HttpGet("views/{connectionId}/{databaseName}")]
        public async Task<IActionResult> Views(string connectionId, string databaseName)
        {
            var sessionId = GetSessionId();
            if (string.IsNullOrEmpty(sessionId))
            {
                return BadRequest("The provided request header does not contain ID property.");
            }

            return Ok(await _dbManager.GetViews(sessionId!, connectionId, databaseName));
        }
    }
}
