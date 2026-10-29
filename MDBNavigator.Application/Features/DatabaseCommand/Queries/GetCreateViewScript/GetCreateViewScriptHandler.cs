using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.Messaging;

namespace MDBNavigator.Application.Features.DatabaseCommand.Queries.GetCreateViewScript
{
    public record GetCreateViewScriptQuery(string SessionId, string ConnectionId, string DatabaseName, string Schema) : IQuery<string>, IConnectionRequest;

    public class GetCreateViewScriptHandler : ConnectionRequestHandler<GetCreateViewScriptQuery, string>
    {
        public GetCreateViewScriptHandler(IConnectionCache cache, IDatabaseProviderFactory factory) : base(cache, factory) { }

        protected override Task<string> Handle(GetCreateViewScriptQuery request, IDatabaseProvider provider, CancellationToken cancellationToken)
            => Task.FromResult(provider.GetCreateViewScript(request.Schema));
    }
}
