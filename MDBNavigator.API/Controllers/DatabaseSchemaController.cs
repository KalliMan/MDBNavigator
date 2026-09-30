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
    [Route("api/[controller]")]
    [ApiController]
    public class DatabaseSchemaController : BaseApiController
    {
        private readonly IMediator _mediator;

        public DatabaseSchemaController(IMediator mediator) => _mediator = mediator;

        [HttpGet("databases/{connectionId}")]
        public async Task<IActionResult> Databases(string connectionId)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }
            return Ok(await _mediator.Send(new GetDatabasesQuery(sessionId, connectionId)));
        }

        [HttpGet("tables/{connectionId}/{databaseName}")]
        public async Task<IActionResult> Tables(string connectionId, string databaseName)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }
            return Ok(await _mediator.Send(new GetTablesQuery(sessionId, connectionId, databaseName)));
        }

        [HttpGet("tableDefinition/{connectionId}/{databaseName}/{schema}/{table}")]
        public async Task<IActionResult> TableDefinition(string connectionId, string databaseName, string schema, string table)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }
            return Ok(await _mediator.Send(new GetTableDefinitionQuery(sessionId, connectionId, databaseName, schema, table)));
        }

        [HttpGet("storedProcedures/{connectionId}/{databaseName}")]
        public async Task<IActionResult> StoredProcedures(string connectionId, string databaseName)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }
            return Ok(await _mediator.Send(new GetStoredProceduresQuery(sessionId, connectionId, databaseName)));
        }

        [HttpGet("functions/{connectionId}/{databaseName}")]
        public async Task<IActionResult> Functions(string connectionId, string databaseName)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }
            return Ok(await _mediator.Send(new GetFunctionsQuery(sessionId, connectionId, databaseName)));
        }

        [HttpGet("views/{connectionId}/{databaseName}")]
        public async Task<IActionResult> Views(string connectionId, string databaseName)
        {
            if (!TryGetSessionId(out var sessionId, out var errorResult))
            {
                return errorResult!;
            }
            return Ok(await _mediator.Send(new GetViewsQuery(sessionId, connectionId, databaseName)));
        }
    }
}


