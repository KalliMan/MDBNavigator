using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.DTOs.Schema.View;
using MDBNavigator.Application.Messaging;

namespace MDBNavigator.Application.Features.Schema.Queries.GetViews
{
    public record GetViewsQuery(string SessionId, string ConnectionId, string DatabaseName) : IQuery<ViewDetailsDto>, IConnectionRequest;

    public class GetViewsHandler : ConnectionRequestHandler<GetViewsQuery, ViewDetailsDto>
    {
        public GetViewsHandler(IConnectionCache cache, IDatabaseProviderFactory factory) : base(cache, factory) { }

        protected override async Task<ViewDetailsDto> Handle(GetViewsQuery request, IDatabaseProvider provider, CancellationToken cancellationToken)
        {
            var items = await provider.GetViews(cancellationToken);
            return new ViewDetailsDto
            {
                ConnectionId = request.ConnectionId,
                DataSource = provider.DataSource,
                DatabaseName = request.DatabaseName,
                Views = items
            };
        }
    }
}
