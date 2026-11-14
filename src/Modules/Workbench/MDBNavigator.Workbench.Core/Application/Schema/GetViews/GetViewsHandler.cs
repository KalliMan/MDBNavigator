using MDBNavigator.Connections.Contracts;
using MDBNavigator.Providers.Abstractions;
using MDBNavigator.SharedKernel.Messaging;

namespace MDBNavigator.Workbench.Application.Schema.GetViews
{
    public record GetViewsQuery(string SessionId, string ConnectionId, string DatabaseName) : IQuery<ViewDetailsDto>, IConnectionRequest;

    public class GetViewsHandler : ConnectionRequestHandler<GetViewsQuery, ViewDetailsDto>
    {
        public GetViewsHandler(IDatabaseConnector connector) : base(connector) { }

        protected override async Task<ViewDetailsDto> Handle(GetViewsQuery request, IDatabaseClient database, CancellationToken cancellationToken)
        {
            var items = await database.Schema.GetViews(cancellationToken);
            return new ViewDetailsDto
            {
                ConnectionId = request.ConnectionId,
                DataSource = database.DataSource,
                DatabaseName = request.DatabaseName,
                Views = items
            };
        }
    }
}
