using MDBNavigator.API.DTOs;
using MDBNavigator.API.RateLimiting;
using MDBNavigator.SharedKernel.Messaging;
using MDBNavigator.Workbench.Application.Queries;
using MDBNavigator.Workbench.Application.Queries.CancelQuery;
using MDBNavigator.Workbench.Application.Queries.RunQuery;
using MDBNavigator.Workbench.Application.Scripts;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MDBNavigator.API.Controllers
{
    public class DatabaseCommandController : BaseApiController
    {
        // Starts a streamed execution: 202 at once, results and the outcome arrive via SignalR.
        [HttpPost]
        [EnableRateLimiting(RateLimitPolicies.Query)]
        public async Task<IActionResult> Execute([FromBody] DatabaseSQLCommandQuery value,
            [FromServices] ICommandHandler<RunQueryCommand, CommandAcknowledgedDto> handler, CancellationToken cancellationToken)
            => Accepted(await handler.Handle(
                new RunQueryCommand(SessionId, value.ConnectionId, value.ExecutionId, value.DatabaseName, value.CmdQuery), cancellationToken));

        // The outcome is reported by the CommandFinished hub message (status Cancelled).
        [HttpPost("cancel/{executionId}")]
        public async Task<IActionResult> Cancel(string executionId,
            [FromServices] ICommandHandler<CancelQueryCommand> handler, CancellationToken cancellationToken)
        {
            await handler.Handle(new CancelQueryCommand(SessionId, executionId), cancellationToken);
            return NoContent();
        }

        [HttpGet("tableRecordsScript/{connectionId}")]
        public async Task<IActionResult> GetTopNTableRecordsScript(string connectionId, [FromQuery] string database, [FromQuery] string schema, [FromQuery] string table, [FromQuery] int? recordsNumber,
            [FromServices] IQueryHandler<GetScriptQuery, string> handler, CancellationToken cancellationToken)
            => Ok(await handler.Handle(new GetScriptQuery(SessionId, connectionId, database, ScriptKind.TopNTableRecords, schema, table, recordsNumber), cancellationToken));

        [HttpGet("createNewTableScript/{connectionId}")]
        public async Task<IActionResult> GetCreateNewTableScript(string connectionId, [FromQuery] string database, [FromQuery] string schema,
            [FromServices] IQueryHandler<GetScriptQuery, string> handler, CancellationToken cancellationToken)
            => Ok(await handler.Handle(new GetScriptQuery(SessionId, connectionId, database, ScriptKind.CreateNewTable, schema), cancellationToken));

        [HttpGet("createTableScript/{connectionId}")]
        public async Task<IActionResult> GetCreateTableScript(string connectionId, [FromQuery] string database, [FromQuery] string schema, [FromQuery] string table,
            [FromServices] IQueryHandler<GetScriptQuery, string> handler, CancellationToken cancellationToken)
            => Ok(await handler.Handle(new GetScriptQuery(SessionId, connectionId, database, ScriptKind.CreateTable, schema, table), cancellationToken));

        [HttpGet("dropTableScript/{connectionId}")]
        public async Task<IActionResult> GetDropTableScript(string connectionId, [FromQuery] string database, [FromQuery] string schema, [FromQuery] string table,
            [FromServices] IQueryHandler<GetScriptQuery, string> handler, CancellationToken cancellationToken)
            => Ok(await handler.Handle(new GetScriptQuery(SessionId, connectionId, database, ScriptKind.DropTable, schema, table), cancellationToken));

        [HttpGet("insertTableScript/{connectionId}")]
        public async Task<IActionResult> GetInsertTableScript(string connectionId, [FromQuery] string database, [FromQuery] string schema, [FromQuery] string table,
            [FromServices] IQueryHandler<GetScriptQuery, string> handler, CancellationToken cancellationToken)
            => Ok(await handler.Handle(new GetScriptQuery(SessionId, connectionId, database, ScriptKind.InsertTable, schema, table), cancellationToken));

        [HttpGet("procedureDefinition/{connectionId}")]
        public async Task<IActionResult> GetProcedureDefinition(string connectionId, [FromQuery] string database, [FromQuery] string schema, [FromQuery] string name,
            [FromServices] IQueryHandler<GetScriptQuery, string> handler, CancellationToken cancellationToken)
            => Ok(await handler.Handle(new GetScriptQuery(SessionId, connectionId, database, ScriptKind.ProcedureDefinition, schema, name), cancellationToken));

        [HttpGet("createStoredProcedureScript/{connectionId}")]
        public async Task<IActionResult> GetCreateStoredProcedureScript(string connectionId, [FromQuery] string database, [FromQuery] string schema,
            [FromServices] IQueryHandler<GetScriptQuery, string> handler, CancellationToken cancellationToken)
            => Ok(await handler.Handle(new GetScriptQuery(SessionId, connectionId, database, ScriptKind.CreateStoredProcedure, schema), cancellationToken));

        [HttpGet("createFunctionScript/{connectionId}")]
        public async Task<IActionResult> GetCreateFunctionScript(string connectionId, [FromQuery] string database, [FromQuery] string schema,
            [FromServices] IQueryHandler<GetScriptQuery, string> handler, CancellationToken cancellationToken)
            => Ok(await handler.Handle(new GetScriptQuery(SessionId, connectionId, database, ScriptKind.CreateFunction, schema), cancellationToken));

        [HttpGet("dropProcedureScript/{connectionId}")]
        public async Task<IActionResult> GetDropProcedureScript(string connectionId, [FromQuery] string database, [FromQuery] string schema, [FromQuery] string name,
            [FromServices] IQueryHandler<GetScriptQuery, string> handler, CancellationToken cancellationToken)
            => Ok(await handler.Handle(new GetScriptQuery(SessionId, connectionId, database, ScriptKind.DropProcedure, schema, name), cancellationToken));

        [HttpGet("viewDefinition/{connectionId}")]
        public async Task<IActionResult> GetViewDefinition(string connectionId, [FromQuery] string database, [FromQuery] string schema, [FromQuery] string name,
            [FromServices] IQueryHandler<GetScriptQuery, string> handler, CancellationToken cancellationToken)
            => Ok(await handler.Handle(new GetScriptQuery(SessionId, connectionId, database, ScriptKind.ViewDefinition, schema, name), cancellationToken));

        [HttpGet("createViewScript/{connectionId}")]
        public async Task<IActionResult> GetCreateViewScript(string connectionId, [FromQuery] string database, [FromQuery] string schema,
            [FromServices] IQueryHandler<GetScriptQuery, string> handler, CancellationToken cancellationToken)
            => Ok(await handler.Handle(new GetScriptQuery(SessionId, connectionId, database, ScriptKind.CreateView, schema), cancellationToken));

        [HttpGet("dropViewScript/{connectionId}")]
        public async Task<IActionResult> GetDropViewScript(string connectionId, [FromQuery] string database, [FromQuery] string schema, [FromQuery] string name,
            [FromServices] IQueryHandler<GetScriptQuery, string> handler, CancellationToken cancellationToken)
            => Ok(await handler.Handle(new GetScriptQuery(SessionId, connectionId, database, ScriptKind.DropView, schema, name), cancellationToken));
    }
}
