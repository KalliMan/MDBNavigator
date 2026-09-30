using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.Messaging;
using MediatR;

namespace MDBNavigator.Application.Features.DatabaseCommand.Queries.GetCreateNewTableScript
{
    public record GetCreateNewTableScriptQuery(string SessionId, string ConnectionId, string DatabaseName, string Schema) : IQuery<string>;

    public class GetCreateNewTableScriptHandler : IRequestHandler<GetCreateNewTableScriptQuery, string>
    {
        private readonly IConnectionCache _cache;
        private readonly IDatabaseProviderFactory _factory;

        public GetCreateNewTableScriptHandler(IConnectionCache cache, IDatabaseProviderFactory factory) { _cache = cache; _factory = factory; }

        public async Task<string> Handle(GetCreateNewTableScriptQuery request, CancellationToken cancellationToken)
        {
            await using var provider = await HandlerHelper.CreateProviderAsync(_cache, _factory, request.SessionId, request.ConnectionId, request.DatabaseName);
            return provider.GetCreateNewTableScript(request.Schema);
        }
    }
}
