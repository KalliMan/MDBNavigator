using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.DTOs.Schema.Table;
using MDBNavigator.Application.Messaging;

namespace MDBNavigator.Application.Features.Schema.Queries.GetTableDefinition
{
    public record GetTableDefinitionQuery(string SessionId, string ConnectionId, string DatabaseName, string Schema, string Table) : IQuery<TableDefinitionDto>, IConnectionRequest;

    public class GetTableDefinitionHandler : ConnectionRequestHandler<GetTableDefinitionQuery, TableDefinitionDto>
    {
        public GetTableDefinitionHandler(IConnectionCache cache, IDatabaseProviderFactory factory) : base(cache, factory) { }

        protected override async Task<TableDefinitionDto> Handle(GetTableDefinitionQuery request, IDatabaseProvider provider, CancellationToken cancellationToken)
        {
            var definition = await provider.GetTableDefinition(request.Schema, request.Table, cancellationToken);
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
