using AutoMapper;
using MDBNavigator.API.DTOs;
using MDBNavigator.BL.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Models;

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

        [HttpGet("databases")]
        public async Task<IActionResult> Databases()
        {
            var sessionId = GetSessionId();
            if (string.IsNullOrEmpty(sessionId))
            {
                return BadRequest("The provided request header does not contain ID property.");
            }

            return Ok(await _dbManager.GetDatabases(sessionId!));
        }

        [HttpGet("tables/{databaseName}")]
        public async Task<IActionResult> Tables(string databaseName)
        {
            var sessionId = GetSessionId();
            if (string.IsNullOrEmpty(sessionId))
            {
                return BadRequest("The provided request header does not contain ID property.");
            }

            return Ok(await _dbManager.GetTables(sessionId!, databaseName));
        }

        [HttpGet("storedProcedures/{databaseName}")]
        public async Task<IActionResult> StoredProcedures(string databaseName)
        {
            var sessionId = GetSessionId();
            if (string.IsNullOrEmpty(sessionId))
            {
                return BadRequest("The provided request header does not contain ID property.");
            }

            return Ok(await _dbManager.GetStoredProcedures(sessionId!, databaseName));
        }

        [HttpGet("functions/{databaseName}")]
        public async Task<IActionResult> Functions(string databaseName)
        {
            var sessionId = GetSessionId();
            if (string.IsNullOrEmpty(sessionId))
            {
                return BadRequest("The provided request header does not contain ID property.");
            }

            return Ok(await _dbManager.GetFunctions(sessionId!, databaseName));
        }

        [HttpGet("views/{databaseName}")]
        public async Task<IActionResult> Views(string databaseName)
        {
            var sessionId = GetSessionId();
            if (string.IsNullOrEmpty(sessionId))
            {
                return BadRequest("The provided request header does not contain ID property.");
            }

            return Ok(await _dbManager.GetViews(sessionId!, databaseName));
        }
    }
}
