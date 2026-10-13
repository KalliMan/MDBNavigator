using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.DTOs.Schema.Table;
using MDBNavigator.Application.Messaging;
using MediatR;

namespace MDBNavigator.Application.Features.Schema.Queries.GetTables
{
    public record GetTablesQuery(string SessionId, string ConnectionId, string DatabaseName) : IQuery<TablesDetailsDto>;

    public class GetTablesHandler : IRequestHandler<GetTablesQuery, TablesDetailsDto>
    {
        private readonly IConnectionCache _cache;
        private readonly IDatabaseProviderFactory _factory;

        public GetTablesHandler(IConnectionCache cache, IDatabaseProviderFactory factory)
        {
            _cache = cache;
            _factory = factory;
        }

        public async Task<TablesDetailsDto> Handle(GetTablesQuery request, CancellationToken cancellationToken)
        {
            await using var provider = await DbConnectionHelper.CreateProviderAsync(_cache, _factory, request.SessionId, request.ConnectionId, request.DatabaseName);
            var tables = await provider.GetTables();
            return new TablesDetailsDto
            {
                ConnectionId = request.ConnectionId,
                DataSource = provider.DataSource,
                DatabaseName = request.DatabaseName,
                Tables = tables
            };
        }
    }
}

