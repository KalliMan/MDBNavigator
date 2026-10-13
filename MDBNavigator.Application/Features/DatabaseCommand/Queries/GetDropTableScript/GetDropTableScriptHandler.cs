using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.Messaging;
using MediatR;

namespace MDBNavigator.Application.Features.DatabaseCommand.Queries.GetDropTableScript
{
    public record GetDropTableScriptQuery(string SessionId, string ConnectionId, string DatabaseName, string Schema, string Table) : IQuery<string>;

    public class GetDropTableScriptHandler : IRequestHandler<GetDropTableScriptQuery, string>
    {
        private readonly IConnectionCache _cache;
        private readonly IDatabaseProviderFactory _factory;

        public GetDropTableScriptHandler(IConnectionCache cache, IDatabaseProviderFactory factory) { _cache = cache; _factory = factory; }

        public async Task<string> Handle(GetDropTableScriptQuery request, CancellationToken cancellationToken)
        {
            await using var provider = await DbConnectionHelper.CreateProviderAsync(_cache, _factory, request.SessionId, request.ConnectionId, request.DatabaseName);
            return provider.GetDropTableScript(request.Schema, request.Table);
        }
    }
}

