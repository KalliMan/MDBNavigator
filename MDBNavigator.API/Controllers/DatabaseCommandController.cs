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

        [HttpGet("tableRecordsScript/{connectionId}/{databaseName}/{schema}/{table}/{recordsNumber}")]
        public async Task<IActionResult> GetTopNTableRecordsScript(string connectionId, string databaseName, string schema, string table, int? recordsNumber, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetTopNTableRecordsScriptQuery(SessionId, connectionId, databaseName, schema, table, recordsNumber), cancellationToken));

        [HttpGet("createNewTableScript/{connectionId}/{databaseName}/{schema}")]
        public async Task<IActionResult> GetCreateNewTableScript(string connectionId, string databaseName, string schema, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetCreateNewTableScriptQuery(SessionId, connectionId, databaseName, schema), cancellationToken));

        [HttpGet("createTableScript/{connectionId}/{databaseName}/{schema}/{table}")]
        public async Task<IActionResult> GetCreateTableScript(string connectionId, string databaseName, string schema, string table, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetCreateTableScriptQuery(SessionId, connectionId, databaseName, schema, table), cancellationToken));

        [HttpGet("dropTableScript/{connectionId}/{databaseName}/{schema}/{table}")]
        public async Task<IActionResult> GetDropTableScript(string connectionId, string databaseName, string schema, string table, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetDropTableScriptQuery(SessionId, connectionId, databaseName, schema, table), cancellationToken));

        [HttpGet("insertTableScript/{connectionId}/{databaseName}/{schema}/{table}")]
        public async Task<IActionResult> GetInsertTableScript(string connectionId, string databaseName, string schema, string table, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetInsertTableScriptQuery(SessionId, connectionId, databaseName, schema, table), cancellationToken));

        [HttpGet("procedureDefinition/{connectionId}/{databaseName}/{schema}/{name}")]
        public async Task<IActionResult> GetProcedureDefinition(string connectionId, string databaseName, string schema, string name, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetProcedureDefinitionQuery(SessionId, connectionId, databaseName, schema, name), cancellationToken));

        [HttpGet("createStoredProcedureScript/{connectionId}/{databaseName}/{schema}")]
        public async Task<IActionResult> GetCreateStoredProcedureScript(string connectionId, string databaseName, string schema, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetCreateStoredProcedureScriptQuery(SessionId, connectionId, databaseName, schema), cancellationToken));

        [HttpGet("createFunctionScript/{connectionId}/{databaseName}/{schema}")]
        public async Task<IActionResult> GetCreateFunctionScript(string connectionId, string databaseName, string schema, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetCreateFunctionScriptQuery(SessionId, connectionId, databaseName, schema), cancellationToken));

        [HttpGet("dropProcedureScript/{connectionId}/{databaseName}/{schema}/{name}")]
        public async Task<IActionResult> GetDropProcedureScript(string connectionId, string databaseName, string schema, string name, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetDropProcedureScriptQuery(SessionId, connectionId, databaseName, schema, name), cancellationToken));

        [HttpGet("viewDefinition/{connectionId}/{databaseName}/{schema}/{name}")]
        public async Task<IActionResult> GetViewDefinition(string connectionId, string databaseName, string schema, string name, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetViewDefinitionQuery(SessionId, connectionId, databaseName, schema, name), cancellationToken));

        [HttpGet("createViewScript/{connectionId}/{databaseName}/{schema}")]
        public async Task<IActionResult> GetCreateViewScript(string connectionId, string databaseName, string schema, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetCreateViewScriptQuery(SessionId, connectionId, databaseName, schema), cancellationToken));

        [HttpGet("dropViewScript/{connectionId}/{databaseName}/{schema}/{name}")]
        public async Task<IActionResult> GetDropViewScript(string connectionId, string databaseName, string schema, string name, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetDropViewScriptQuery(SessionId, connectionId, databaseName, schema, name), cancellationToken));
    }
}
