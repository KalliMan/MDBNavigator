using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.Messaging;

namespace MDBNavigator.Application.Features.DatabaseCommand.Queries.GetCreateTableScript
{
    public record GetCreateTableScriptQuery(string SessionId, string ConnectionId, string DatabaseName, string Schema, string Table) : IQuery<string>, IConnectionRequest;

    public class GetCreateTableScriptHandler : ConnectionRequestHandler<GetCreateTableScriptQuery, string>
    {
        public GetCreateTableScriptHandler(IConnectionCache cache, IDatabaseProviderFactory factory) : base(cache, factory) { }

        protected override Task<string> Handle(GetCreateTableScriptQuery request, IDatabaseProvider provider, CancellationToken cancellationToken)
            => provider.GetCreateTableScript(request.Schema, request.Table, cancellationToken);
    }
}
