using MDBNavigator.Application.Features.Schema.Queries.GetDatabases;
using MDBNavigator.Application.Features.Schema.Queries.GetFunctions;
using MDBNavigator.Application.Features.Schema.Queries.GetStoredProcedures;
using MDBNavigator.Application.Features.Schema.Queries.GetTableDefinition;
using MDBNavigator.Application.Features.Schema.Queries.GetTables;
using MDBNavigator.Application.Features.Schema.Queries.GetViews;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace MDBNavigator.API.Controllers
{
    public class DatabaseSchemaController : BaseApiController
    {
        private readonly IMediator _mediator;

        public DatabaseSchemaController(IMediator mediator) => _mediator = mediator;

        [HttpGet("databases/{connectionId}")]
        public async Task<IActionResult> Databases(string connectionId, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetDatabasesQuery(SessionId, connectionId), cancellationToken));

        [HttpGet("tables/{connectionId}")]
        public async Task<IActionResult> Tables(string connectionId, [FromQuery] string database, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetTablesQuery(SessionId, connectionId, database), cancellationToken));

        [HttpGet("tableDefinition/{connectionId}")]
        public async Task<IActionResult> TableDefinition(string connectionId, [FromQuery] string database, [FromQuery] string schema, [FromQuery] string table, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetTableDefinitionQuery(SessionId, connectionId, database, schema, table), cancellationToken));

        [HttpGet("storedProcedures/{connectionId}")]
        public async Task<IActionResult> StoredProcedures(string connectionId, [FromQuery] string database, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetStoredProceduresQuery(SessionId, connectionId, database), cancellationToken));

        [HttpGet("functions/{connectionId}")]
        public async Task<IActionResult> Functions(string connectionId, [FromQuery] string database, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetFunctionsQuery(SessionId, connectionId, database), cancellationToken));

        [HttpGet("views/{connectionId}")]
        public async Task<IActionResult> Views(string connectionId, [FromQuery] string database, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetViewsQuery(SessionId, connectionId, database), cancellationToken));
    }
}
