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
    public class DatabaseCommandController : BaseApiController
    {
        private readonly IMediator _mediator;

        public DatabaseCommandController(IMediator mediator) => _mediator = mediator;

        // Starts a streamed execution: 202 at once, results and the outcome arrive via SignalR.
        [HttpPost]
        public async Task<IActionResult> Execute([FromBody] DatabaseSQLCommandQuery value, CancellationToken cancellationToken)
            => Accepted(await _mediator.Send(
                new ExecuteQueryQuery(SessionId, value.ConnectionId, value.ExecutionId, value.DatabaseName, value.CmdQuery), cancellationToken));

        // The outcome is reported by the CommandFinished hub message (status Cancelled).
        [HttpPost("cancel/{executionId}")]
        public async Task<IActionResult> Cancel(string executionId, CancellationToken cancellationToken)
        {
            await _mediator.Send(new CancelQueryCommand(SessionId, executionId), cancellationToken);
            return NoContent();
        }

        [HttpGet("tableRecordsScript/{connectionId}")]
        public async Task<IActionResult> GetTopNTableRecordsScript(string connectionId, [FromQuery] string database, [FromQuery] string schema, [FromQuery] string table, [FromQuery] int? recordsNumber, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetTopNTableRecordsScriptQuery(SessionId, connectionId, database, schema, table, recordsNumber), cancellationToken));

        [HttpGet("createNewTableScript/{connectionId}")]
        public async Task<IActionResult> GetCreateNewTableScript(string connectionId, [FromQuery] string database, [FromQuery] string schema, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetCreateNewTableScriptQuery(SessionId, connectionId, database, schema), cancellationToken));

        [HttpGet("createTableScript/{connectionId}")]
        public async Task<IActionResult> GetCreateTableScript(string connectionId, [FromQuery] string database, [FromQuery] string schema, [FromQuery] string table, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetCreateTableScriptQuery(SessionId, connectionId, database, schema, table), cancellationToken));

        [HttpGet("dropTableScript/{connectionId}")]
        public async Task<IActionResult> GetDropTableScript(string connectionId, [FromQuery] string database, [FromQuery] string schema, [FromQuery] string table, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetDropTableScriptQuery(SessionId, connectionId, database, schema, table), cancellationToken));

        [HttpGet("insertTableScript/{connectionId}")]
        public async Task<IActionResult> GetInsertTableScript(string connectionId, [FromQuery] string database, [FromQuery] string schema, [FromQuery] string table, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetInsertTableScriptQuery(SessionId, connectionId, database, schema, table), cancellationToken));

        [HttpGet("procedureDefinition/{connectionId}")]
        public async Task<IActionResult> GetProcedureDefinition(string connectionId, [FromQuery] string database, [FromQuery] string schema, [FromQuery] string name, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetProcedureDefinitionQuery(SessionId, connectionId, database, schema, name), cancellationToken));

        [HttpGet("createStoredProcedureScript/{connectionId}")]
        public async Task<IActionResult> GetCreateStoredProcedureScript(string connectionId, [FromQuery] string database, [FromQuery] string schema, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetCreateStoredProcedureScriptQuery(SessionId, connectionId, database, schema), cancellationToken));

        [HttpGet("createFunctionScript/{connectionId}")]
        public async Task<IActionResult> GetCreateFunctionScript(string connectionId, [FromQuery] string database, [FromQuery] string schema, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetCreateFunctionScriptQuery(SessionId, connectionId, database, schema), cancellationToken));

        [HttpGet("dropProcedureScript/{connectionId}")]
        public async Task<IActionResult> GetDropProcedureScript(string connectionId, [FromQuery] string database, [FromQuery] string schema, [FromQuery] string name, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetDropProcedureScriptQuery(SessionId, connectionId, database, schema, name), cancellationToken));

        [HttpGet("viewDefinition/{connectionId}")]
        public async Task<IActionResult> GetViewDefinition(string connectionId, [FromQuery] string database, [FromQuery] string schema, [FromQuery] string name, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetViewDefinitionQuery(SessionId, connectionId, database, schema, name), cancellationToken));

        [HttpGet("createViewScript/{connectionId}")]
        public async Task<IActionResult> GetCreateViewScript(string connectionId, [FromQuery] string database, [FromQuery] string schema, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetCreateViewScriptQuery(SessionId, connectionId, database, schema), cancellationToken));

        [HttpGet("dropViewScript/{connectionId}")]
        public async Task<IActionResult> GetDropViewScript(string connectionId, [FromQuery] string database, [FromQuery] string schema, [FromQuery] string name, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetDropViewScriptQuery(SessionId, connectionId, database, schema, name), cancellationToken));
    }
}
