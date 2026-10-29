using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.Messaging;

namespace MDBNavigator.Application.Features.DatabaseCommand.Queries.GetDropViewScript
{
    public record GetDropViewScriptQuery(string SessionId, string ConnectionId, string DatabaseName, string Schema, string Name) : IQuery<string>, IConnectionRequest;

    public class GetDropViewScriptHandler : ConnectionRequestHandler<GetDropViewScriptQuery, string>
    {
        public GetDropViewScriptHandler(IConnectionCache cache, IDatabaseProviderFactory factory) : base(cache, factory) { }

        protected override Task<string> Handle(GetDropViewScriptQuery request, IDatabaseProvider provider, CancellationToken cancellationToken)
            => Task.FromResult(provider.GetDropViewScript(request.Schema, request.Name));
    }
}
