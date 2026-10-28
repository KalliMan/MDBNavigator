using MDBNavigator.API.DTOs;
using MDBNavigator.Application.Features.DatabaseCommand.Commands.CancelQuery;
using MDBNavigator.Application.Features.DatabaseCommand.Queries.ExecuteQuery;
using MDBNavigator.Application.Features.DatabaseCommand.Queries.GetCreateFunctionScript;
using MDBNavigator.Application.Features.DatabaseCommand.Queries.GetCreateNewTableScript;
using MDBNavigator.Application.Features.DatabaseCommand.Queries.GetCreateStoredProcedureScript;
using MDBNavigator.Application.Features.DatabaseCommand.Queries.GetCreateTableScript;
using MDBNavigator.Application.Features.DatabaseCommand.Queries.GetCreateViewScript;
using MDBNavigator.Application.Features.DatabaseCommand.Queries.GetDropProcedureScript;
using MDBNavigator.Application.Features.DatabaseCommand.Queries.GetDropTableScript;
using MDBNavigator.Application.Features.DatabaseCommand.Queries.GetDropViewScript;
using MDBNavigator.Application.Features.DatabaseCommand.Queries.GetInsertTableScript;
using MDBNavigator.Application.Features.DatabaseCommand.Queries.GetProcedureDefinition;
using MDBNavigator.Application.Features.DatabaseCommand.Queries.GetTopNTableRecordsScript;
using MDBNavigator.Application.Features.DatabaseCommand.Queries.GetViewDefinition;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace MDBNavigator.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DatabaseCommandController : BaseApiController
    {
        private readonly IMediator _mediator;

        public DatabaseCommandController(IMediator mediator) => _mediator = mediator;

        [HttpGet("tableRecordsScript/{connectionId}/{id}/{databaseName}/{schema}/{table}/{recordsNumber}")]
        public async Task<IActionResult> GetTopNTableRecordsScript(string connectionId, string id, string databaseName, string schema, string table, int? recordsNumber)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }
            return Ok(await _mediator.Send(new GetTopNTableRecordsScriptQuery(sessionId, connectionId, id, databaseName, schema, table, recordsNumber)));
        }

        [HttpGet("createNewTableScript/{connectionId}/{databaseName}/{schema}")]
        public async Task<IActionResult> GetCreateNewTableScript(string connectionId, string databaseName, string schema)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }
            return Ok(await _mediator.Send(new GetCreateNewTableScriptQuery(sessionId, connectionId, databaseName, schema)));
        }

        [HttpGet("createTableScript/{connectionId}/{databaseName}/{schema}/{table}")]
        public async Task<IActionResult> GetCreateTableScript(string connectionId, string databaseName, string schema, string table)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }
            return Ok(await _mediator.Send(new GetCreateTableScriptQuery(sessionId, connectionId, databaseName, schema, table)));
        }

        [HttpGet("dropTableScript/{connectionId}/{databaseName}/{schema}/{table}")]
        public async Task<IActionResult> GetDropTableScript(string connectionId, string databaseName, string schema, string table)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }
            return Ok(await _mediator.Send(new GetDropTableScriptQuery(sessionId, connectionId, databaseName, schema, table)));
        }

        [HttpGet("insertTableScript/{connectionId}/{databaseName}/{schema}/{table}")]
        public async Task<IActionResult> GetInsertTableScript(string connectionId, string databaseName, string schema, string table)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }
            return Ok(await _mediator.Send(new GetInsertTableScriptQuery(sessionId, connectionId, databaseName, schema, table)));
        }

        [HttpPost]
        public async Task<IActionResult> Execute([FromBody] DatabaseSQLCommandQuery value)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }
            var acknowledged = await _mediator.Send(new ExecuteQueryQuery(sessionId, value.ConnectionId, value.Id, value.ExecutionId, value.DatabaseName, value.CmdQuery));
            return Accepted(acknowledged);
        }

        [HttpPost("cancel/{commandId}")]
        public async Task<IActionResult> Cancel(string commandId)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }
            await _mediator.Send(new CancelQueryCommand(sessionId, commandId));
            return NoContent();
        }

        [HttpGet("procedureDefinition/{connectionId}/{databaseName}/{schema}/{name}")]
        public async Task<IActionResult> GetProcedureDefinition(string connectionId, string databaseName, string schema, string name)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }
            return Ok(await _mediator.Send(new GetProcedureDefinitionQuery(sessionId, connectionId, databaseName, schema, name)));
        }

        [HttpGet("createStoredProcedureScript/{connectionId}/{databaseName}/{schema}")]
        public async Task<IActionResult> GetCreateStoredProcedureScript(string connectionId, string databaseName, string schema)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }
            return Ok(await _mediator.Send(new GetCreateStoredProcedureScriptQuery(sessionId, connectionId, databaseName, schema)));
        }

        [HttpGet("createFunctionScript/{connectionId}/{databaseName}/{schema}")]
        public async Task<IActionResult> GetCreateFunctionScript(string connectionId, string databaseName, string schema)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }
            return Ok(await _mediator.Send(new GetCreateFunctionScriptQuery(sessionId, connectionId, databaseName, schema)));
        }

        [HttpGet("dropProcedureScript/{connectionId}/{databaseName}/{schema}/{name}")]
        public async Task<IActionResult> GetDropProcedureScript(string connectionId, string databaseName, string schema, string name)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }
            return Ok(await _mediator.Send(new GetDropProcedureScriptQuery(sessionId, connectionId, databaseName, schema, name)));
        }

        [HttpGet("viewDefinition/{connectionId}/{databaseName}/{schema}/{name}")]
        public async Task<IActionResult> GetViewDefinition(string connectionId, string databaseName, string schema, string name)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }
            return Ok(await _mediator.Send(new GetViewDefinitionQuery(sessionId, connectionId, databaseName, schema, name)));
        }

        [HttpGet("createViewScript/{connectionId}/{databaseName}/{schema}")]
        public async Task<IActionResult> GetCreateViewScript(string connectionId, string databaseName, string schema)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }
            return Ok(await _mediator.Send(new GetCreateViewScriptQuery(sessionId, connectionId, databaseName, schema)));
        }

        [HttpGet("dropViewScript/{connectionId}/{databaseName}/{schema}/{name}")]
        public async Task<IActionResult> GetDropViewScript(string connectionId, string databaseName, string schema, string name)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }
            return Ok(await _mediator.Send(new GetDropViewScriptQuery(sessionId, connectionId, databaseName, schema, name)));
        }
    }
}


