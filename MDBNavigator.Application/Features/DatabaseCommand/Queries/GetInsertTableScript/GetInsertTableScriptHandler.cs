using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.Messaging;

namespace MDBNavigator.Application.Features.DatabaseCommand.Queries.GetInsertTableScript
{
    public record GetInsertTableScriptQuery(string SessionId, string ConnectionId, string DatabaseName, string Schema, string Table) : IQuery<string>, IConnectionRequest;

    public class GetInsertTableScriptHandler : ConnectionRequestHandler<GetInsertTableScriptQuery, string>
    {
        public GetInsertTableScriptHandler(IConnectionCache cache, IDatabaseProviderFactory factory) : base(cache, factory) { }

        protected override Task<string> Handle(GetInsertTableScriptQuery request, IDatabaseProvider provider, CancellationToken cancellationToken)
            => provider.GetInsertTableScript(request.Schema, request.Table, cancellationToken);
    }
}
