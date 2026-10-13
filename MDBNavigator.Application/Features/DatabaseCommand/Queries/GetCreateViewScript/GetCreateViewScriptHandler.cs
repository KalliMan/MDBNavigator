using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.Messaging;
using MediatR;

namespace MDBNavigator.Application.Features.DatabaseCommand.Queries.GetCreateViewScript
{
    public record GetCreateViewScriptQuery(string SessionId, string ConnectionId, string DatabaseName, string Schema) : IQuery<string>;

    public class GetCreateViewScriptHandler : IRequestHandler<GetCreateViewScriptQuery, string>
    {
        private readonly IConnectionCache _cache;
        private readonly IDatabaseProviderFactory _factory;

        public GetCreateViewScriptHandler(IConnectionCache cache, IDatabaseProviderFactory factory) { _cache = cache; _factory = factory; }

        public async Task<string> Handle(GetCreateViewScriptQuery request, CancellationToken cancellationToken)
        {
            await using var provider = await DbConnectionHelper.CreateProviderAsync(_cache, _factory, request.SessionId, request.ConnectionId, request.DatabaseName);
            return provider.GetCreateViewScript(request.Schema);
        }
    }
}

