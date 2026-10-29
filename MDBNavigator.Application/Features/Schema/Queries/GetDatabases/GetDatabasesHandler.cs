using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.DTOs.Schema.Database;
using MDBNavigator.Application.Messaging;

namespace MDBNavigator.Application.Features.Schema.Queries.GetDatabases
{
    public record GetDatabasesQuery(string SessionId, string ConnectionId) : IQuery<DatabasesDetailsDto>, IConnectionRequest
    {
        public string? DatabaseName => null;
    }

    public class GetDatabasesHandler : ConnectionRequestHandler<GetDatabasesQuery, DatabasesDetailsDto>
    {
        public GetDatabasesHandler(IConnectionCache cache, IDatabaseProviderFactory factory) : base(cache, factory) { }

        protected override async Task<DatabasesDetailsDto> Handle(GetDatabasesQuery request, IDatabaseProvider provider, CancellationToken cancellationToken)
        {
            var items = await provider.GetDatabases(cancellationToken);
            return new DatabasesDetailsDto
            {
                ConnectionId = request.ConnectionId,
                DataSource = provider.DataSource,
                Databases = items
            };
        }
    }
}
