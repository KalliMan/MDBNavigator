using MDBNavigator.Connections.Contracts;
using MDBNavigator.Providers.Abstractions;
using MDBNavigator.SharedKernel.Messaging;

namespace MDBNavigator.Workbench.Application.Schema.GetDatabases
{
    public record GetDatabasesQuery(string SessionId, string ConnectionId) : IQuery<DatabasesDetailsDto>, IConnectionRequest
    {
        public string? DatabaseName => null;
    }

    public class GetDatabasesHandler : ConnectionRequestHandler<GetDatabasesQuery, DatabasesDetailsDto>
    {
        public GetDatabasesHandler(IDatabaseConnector connector) : base(connector) { }

        protected override async Task<DatabasesDetailsDto> Handle(GetDatabasesQuery request, IDatabaseClient database, CancellationToken cancellationToken)
        {
            var items = await database.Schema.GetDatabases(cancellationToken);
            return new DatabasesDetailsDto
            {
                ConnectionId = request.ConnectionId,
                DataSource = database.DataSource,
                Databases = items
            };
        }
    }
}
