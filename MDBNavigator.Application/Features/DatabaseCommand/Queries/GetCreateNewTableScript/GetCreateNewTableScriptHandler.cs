using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.Messaging;

namespace MDBNavigator.Application.Features.DatabaseCommand.Queries.GetCreateNewTableScript
{
    public record GetCreateNewTableScriptQuery(string SessionId, string ConnectionId, string DatabaseName, string Schema) : IQuery<string>, IConnectionRequest;

    public class GetCreateNewTableScriptHandler : ConnectionRequestHandler<GetCreateNewTableScriptQuery, string>
    {
        public GetCreateNewTableScriptHandler(IConnectionCache cache, IDatabaseProviderFactory factory) : base(cache, factory) { }

        protected override Task<string> Handle(GetCreateNewTableScriptQuery request, IDatabaseProvider provider, CancellationToken cancellationToken)
            => Task.FromResult(provider.GetCreateNewTableScript(request.Schema));
    }
}
