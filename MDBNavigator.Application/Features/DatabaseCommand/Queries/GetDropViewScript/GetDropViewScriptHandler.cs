using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.Messaging;
using MediatR;

namespace MDBNavigator.Application.Features.DatabaseCommand.Queries.GetDropViewScript
{
    public record GetDropViewScriptQuery(string SessionId, string ConnectionId, string DatabaseName, string Schema, string Name) : IQuery<string>;

    public class GetDropViewScriptHandler : IRequestHandler<GetDropViewScriptQuery, string>
    {
        private readonly IConnectionCache _cache;
        private readonly IDatabaseProviderFactory _factory;

        public GetDropViewScriptHandler(IConnectionCache cache, IDatabaseProviderFactory factory) { _cache = cache; _factory = factory; }

        public async Task<string> Handle(GetDropViewScriptQuery request, CancellationToken cancellationToken)
        {
            await using var provider = await HandlerHelper.CreateProviderAsync(_cache, _factory, request.SessionId, request.ConnectionId, request.DatabaseName);
            return provider.GetDropViewScript(request.Schema, request.Name);
        }
    }
}
