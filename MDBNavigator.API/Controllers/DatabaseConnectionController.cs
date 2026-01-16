using AutoMapper;
using MDBNavigator.API.DTOs;
using MDBNavigator.BL.Services;
using Microsoft.AspNetCore.Mvc;
using Models.Connect;

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
        public async Task<IActionResult> Connect([FromBody] ConnectionSettingsQuery value)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }

            var connectionSettings = _mapper.Map<ConnectionSettings>(value);
            var result = await _dbManager.Connect(sessionId, connectionSettings);
            return Ok(result);
        }

        [HttpPost("disconnect/{connectionId}")]
        public IActionResult Disconnect([FromRoute] string connectionId)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }

            _dbManager.Disconnect(sessionId, connectionId);
            return Ok();
        }

    }
}
