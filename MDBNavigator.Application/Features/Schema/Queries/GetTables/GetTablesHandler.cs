using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.DTOs.Schema.Table;
using MDBNavigator.Application.Messaging;

namespace MDBNavigator.Application.Features.Schema.Queries.GetTables
{
    public record GetTablesQuery(string SessionId, string ConnectionId, string DatabaseName) : IQuery<TablesDetailsDto>, IConnectionRequest;

    public class GetTablesHandler : ConnectionRequestHandler<GetTablesQuery, TablesDetailsDto>
    {
        public GetTablesHandler(IConnectionCache cache, IDatabaseProviderFactory factory) : base(cache, factory) { }

        protected override async Task<TablesDetailsDto> Handle(GetTablesQuery request, IDatabaseProvider provider, CancellationToken cancellationToken)
        {
            var items = await provider.GetTables(cancellationToken);
            return new TablesDetailsDto
            {
                ConnectionId = request.ConnectionId,
                DataSource = provider.DataSource,
                DatabaseName = request.DatabaseName,
                Tables = items
            };
        }
    }
}
