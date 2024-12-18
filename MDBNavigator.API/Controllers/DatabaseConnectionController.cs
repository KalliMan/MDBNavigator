using AutoMapper;
using MDBNavigator.API.DTOs;
using MDBNavigator.BL.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Models;

namespace MDBNavigator.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DatabaseConnectionController: BaseApiController
    {
        IMapper _mapper;
        IDBManager _dbManager;
        public DatabaseConnectionController(IMapper mapper, IDBManager dbManager)
        {
            _mapper = mapper;
            _dbManager = dbManager;
        }

        // POST api/<DatabaseController>
        [HttpPost("connect")]
        public async Task<IActionResult> Connect([FromBody] ConnectionSettingsDto value)
        {
            var sessionId = Request.Headers["id"];
            if (string.IsNullOrEmpty(sessionId))
            {
                return BadRequest("The provided request header does not contain ID property.");
            }

            var connectionSettings = _mapper.Map<ConnectionSettings>(value);
            var result = await _dbManager.Connect(sessionId!, connectionSettings);
            return Ok(result);
        }

    }
}
