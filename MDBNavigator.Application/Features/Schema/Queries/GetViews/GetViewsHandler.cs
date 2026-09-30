using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.DTOs.Schema.View;
using MDBNavigator.Application.Messaging;
using MediatR;

namespace MDBNavigator.Application.Features.Schema.Queries.GetViews
{
    public record GetViewsQuery(string SessionId, string ConnectionId, string DatabaseName) : IQuery<ViewDetailsDto>;

    public class GetViewsHandler : IRequestHandler<GetViewsQuery, ViewDetailsDto>
    {
        private readonly IConnectionCache _cache;
        private readonly IDatabaseProviderFactory _factory;

        public GetViewsHandler(IConnectionCache cache, IDatabaseProviderFactory factory)
        {
            _cache = cache;
            _factory = factory;
        }

        public async Task<ViewDetailsDto> Handle(GetViewsQuery request, CancellationToken cancellationToken)
        {
            await using var provider = await HandlerHelper.CreateProviderAsync(_cache, _factory, request.SessionId, request.ConnectionId, request.DatabaseName);
            var views = await provider.GetViews();
            return new ViewDetailsDto
            {
                ConnectionId = request.ConnectionId,
                DataSource = provider.DataSource,
                DatabaseName = request.DatabaseName,
                Views = views
            };
        }
    }
}
