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

        [HttpGet("tables/{connectionId}/{databaseName}")]
        public async Task<IActionResult> Tables(string connectionId, string databaseName, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetTablesQuery(SessionId, connectionId, databaseName), cancellationToken));

        [HttpGet("tableDefinition/{connectionId}/{databaseName}/{schema}/{table}")]
        public async Task<IActionResult> TableDefinition(string connectionId, string databaseName, string schema, string table, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetTableDefinitionQuery(SessionId, connectionId, databaseName, schema, table), cancellationToken));

        [HttpGet("storedProcedures/{connectionId}/{databaseName}")]
        public async Task<IActionResult> StoredProcedures(string connectionId, string databaseName, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetStoredProceduresQuery(SessionId, connectionId, databaseName), cancellationToken));

        [HttpGet("functions/{connectionId}/{databaseName}")]
        public async Task<IActionResult> Functions(string connectionId, string databaseName, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetFunctionsQuery(SessionId, connectionId, databaseName), cancellationToken));

        [HttpGet("views/{connectionId}/{databaseName}")]
        public async Task<IActionResult> Views(string connectionId, string databaseName, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetViewsQuery(SessionId, connectionId, databaseName), cancellationToken));
    }
}
