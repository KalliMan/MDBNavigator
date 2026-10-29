using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.Messaging;

namespace MDBNavigator.Application.Features.DatabaseCommand.Queries.GetCreateStoredProcedureScript
{
    public record GetCreateStoredProcedureScriptQuery(string SessionId, string ConnectionId, string DatabaseName, string Schema) : IQuery<string>, IConnectionRequest;

    public class GetCreateStoredProcedureScriptHandler : ConnectionRequestHandler<GetCreateStoredProcedureScriptQuery, string>
    {
        public GetCreateStoredProcedureScriptHandler(IConnectionCache cache, IDatabaseProviderFactory factory) : base(cache, factory) { }

        protected override Task<string> Handle(GetCreateStoredProcedureScriptQuery request, IDatabaseProvider provider, CancellationToken cancellationToken)
            => Task.FromResult(provider.GetCreateStoredProcedureScript(request.Schema));
    }
}
