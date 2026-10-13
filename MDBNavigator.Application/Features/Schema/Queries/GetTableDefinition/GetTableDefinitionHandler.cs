using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.DTOs.Schema.Table;
using MDBNavigator.Application.Messaging;
using MDBNavigator.Domain.Schema.Table;
using MediatR;

namespace MDBNavigator.Application.Features.Schema.Queries.GetTableDefinition
{
    public record GetTableDefinitionQuery(string SessionId, string ConnectionId, string DatabaseName, string Schema, string Table)
        : IQuery<TableDefinitionDto>;

    public class GetTableDefinitionHandler : IRequestHandler<GetTableDefinitionQuery, TableDefinitionDto>
    {
        private readonly IConnectionCache _cache;
        private readonly IDatabaseProviderFactory _factory;

        public GetTableDefinitionHandler(IConnectionCache cache, IDatabaseProviderFactory factory)
        {
            _cache = cache;
            _factory = factory;
        }

        public async Task<TableDefinitionDto> Handle(GetTableDefinitionQuery request, CancellationToken cancellationToken)
        {
            await using var provider = await DbConnectionHelper.CreateProviderAsync(_cache, _factory, request.SessionId, request.ConnectionId, request.DatabaseName);
            var definition = await provider.GetTableDefinition(request.Schema, request.Table);
            return new TableDefinitionDto
            {
                ConnectionId = request.ConnectionId,
                DatabaseName = request.DatabaseName,
                DatabaseSchema = request.Schema,
                Name = request.Table,
                Columns = definition.Columns,
                Indexes = definition.Indexes,
                Constraints = definition.Constraints
            };
        }
    }
}

