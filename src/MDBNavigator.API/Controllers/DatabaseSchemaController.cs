using MDBNavigator.SharedKernel.Messaging;
using MDBNavigator.Workbench.Application.Schema;
using MDBNavigator.Workbench.Application.Schema.GetDatabases;
using MDBNavigator.Workbench.Application.Schema.GetFunctions;
using MDBNavigator.Workbench.Application.Schema.GetStoredProcedures;
using MDBNavigator.Workbench.Application.Schema.GetTableDefinition;
using MDBNavigator.Workbench.Application.Schema.GetTables;
using MDBNavigator.Workbench.Application.Schema.GetViews;
using Microsoft.AspNetCore.Mvc;

namespace MDBNavigator.API.Controllers
{
    public class DatabaseSchemaController : BaseApiController
    {
        [HttpGet("databases/{connectionId}")]
        public async Task<IActionResult> Databases(string connectionId,
            [FromServices] IQueryHandler<GetDatabasesQuery, DatabasesDetailsDto> handler, CancellationToken cancellationToken)
            => Ok(await handler.Handle(new GetDatabasesQuery(SessionId, connectionId), cancellationToken));

        [HttpGet("tables/{connectionId}")]
        public async Task<IActionResult> Tables(string connectionId, [FromQuery] string database,
            [FromServices] IQueryHandler<GetTablesQuery, TablesDetailsDto> handler, CancellationToken cancellationToken)
            => Ok(await handler.Handle(new GetTablesQuery(SessionId, connectionId, database), cancellationToken));

        [HttpGet("tableDefinition/{connectionId}")]
        public async Task<IActionResult> TableDefinition(string connectionId, [FromQuery] string database, [FromQuery] string schema, [FromQuery] string table,
            [FromServices] IQueryHandler<GetTableDefinitionQuery, TableDefinitionDto> handler, CancellationToken cancellationToken)
            => Ok(await handler.Handle(new GetTableDefinitionQuery(SessionId, connectionId, database, schema, table), cancellationToken));

        [HttpGet("storedProcedures/{connectionId}")]
        public async Task<IActionResult> StoredProcedures(string connectionId, [FromQuery] string database,
            [FromServices] IQueryHandler<GetStoredProceduresQuery, ProceduresDetailsDto> handler, CancellationToken cancellationToken)
            => Ok(await handler.Handle(new GetStoredProceduresQuery(SessionId, connectionId, database), cancellationToken));

        [HttpGet("functions/{connectionId}")]
        public async Task<IActionResult> Functions(string connectionId, [FromQuery] string database,
            [FromServices] IQueryHandler<GetFunctionsQuery, ProceduresDetailsDto> handler, CancellationToken cancellationToken)
            => Ok(await handler.Handle(new GetFunctionsQuery(SessionId, connectionId, database), cancellationToken));

        [HttpGet("views/{connectionId}")]
        public async Task<IActionResult> Views(string connectionId, [FromQuery] string database,
            [FromServices] IQueryHandler<GetViewsQuery, ViewDetailsDto> handler, CancellationToken cancellationToken)
            => Ok(await handler.Handle(new GetViewsQuery(SessionId, connectionId, database), cancellationToken));
    }
}
