using MDBNavigator.Connections.Contracts;
using MDBNavigator.Providers.Abstractions;
using MDBNavigator.SharedKernel.Messaging;

namespace MDBNavigator.Workbench.Application.Schema.GetTableDefinition
{
    public record GetTableDefinitionQuery(string SessionId, string ConnectionId, string DatabaseName, string Schema, string Table) : IQuery<TableDefinitionDto>, IConnectionRequest;

    public class GetTableDefinitionHandler : ConnectionRequestHandler<GetTableDefinitionQuery, TableDefinitionDto>
    {
        public GetTableDefinitionHandler(IDatabaseConnector connector) : base(connector) { }

        protected override async Task<TableDefinitionDto> Handle(GetTableDefinitionQuery request, IDatabaseClient database, CancellationToken cancellationToken)
        {
            var definition = await database.Schema.GetTableDefinition(request.Schema, request.Table, cancellationToken);
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
