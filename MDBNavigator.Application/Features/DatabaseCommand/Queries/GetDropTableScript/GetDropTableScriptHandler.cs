using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.Messaging;

namespace MDBNavigator.Application.Features.DatabaseCommand.Queries.GetDropTableScript
{
    public record GetDropTableScriptQuery(string SessionId, string ConnectionId, string DatabaseName, string Schema, string Table) : IQuery<string>, IConnectionRequest;

    public class GetDropTableScriptHandler : ConnectionRequestHandler<GetDropTableScriptQuery, string>
    {
        public GetDropTableScriptHandler(IConnectionCache cache, IDatabaseProviderFactory factory) : base(cache, factory) { }

        protected override Task<string> Handle(GetDropTableScriptQuery request, IDatabaseProvider provider, CancellationToken cancellationToken)
            => Task.FromResult(provider.GetDropTableScript(request.Schema, request.Table));
    }
}
