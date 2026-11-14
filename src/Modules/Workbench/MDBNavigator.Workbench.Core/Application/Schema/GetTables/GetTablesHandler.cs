using MDBNavigator.Connections.Contracts;
using MDBNavigator.Providers.Abstractions;
using MDBNavigator.SharedKernel.Messaging;

namespace MDBNavigator.Workbench.Application.Schema.GetTables
{
    public record GetTablesQuery(string SessionId, string ConnectionId, string DatabaseName) : IQuery<TablesDetailsDto>, IConnectionRequest;

    public class GetTablesHandler : ConnectionRequestHandler<GetTablesQuery, TablesDetailsDto>
    {
        public GetTablesHandler(IDatabaseConnector connector) : base(connector) { }

        protected override async Task<TablesDetailsDto> Handle(GetTablesQuery request, IDatabaseClient database, CancellationToken cancellationToken)
        {
            var items = await database.Schema.GetTables(cancellationToken);
            return new TablesDetailsDto
            {
                ConnectionId = request.ConnectionId,
                DataSource = database.DataSource,
                DatabaseName = request.DatabaseName,
                Tables = items
            };
        }
    }
}
