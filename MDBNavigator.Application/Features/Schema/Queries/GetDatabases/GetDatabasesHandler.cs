using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.DTOs.Schema.Database;
using MDBNavigator.Application.Messaging;
using MediatR;

namespace MDBNavigator.Application.Features.Schema.Queries.GetDatabases
{
    public record GetDatabasesQuery(string SessionId, string ConnectionId) : IQuery<DatabasesDetailsDto>;

    public class GetDatabasesHandler : IRequestHandler<GetDatabasesQuery, DatabasesDetailsDto>
    {
        private readonly IConnectionCache _cache;
        private readonly IDatabaseProviderFactory _factory;

        public GetDatabasesHandler(IConnectionCache cache, IDatabaseProviderFactory factory)
        {
            _cache = cache;
            _factory = factory;
        }

        public async Task<DatabasesDetailsDto> Handle(GetDatabasesQuery request, CancellationToken cancellationToken)
        {
            await using var provider = await HandlerHelper.CreateProviderAsync(_cache, _factory, request.SessionId, request.ConnectionId);
            var databases = await provider.GetDatabases();
            return new DatabasesDetailsDto
            {
                ConnectionId = request.ConnectionId,
                DataSource = provider.DataSource,
                Databases = databases
            };
        }
    }
}
