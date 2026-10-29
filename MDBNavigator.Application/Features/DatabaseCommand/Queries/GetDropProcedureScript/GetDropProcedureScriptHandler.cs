using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.Messaging;

namespace MDBNavigator.Application.Features.DatabaseCommand.Queries.GetDropProcedureScript
{
    public record GetDropProcedureScriptQuery(string SessionId, string ConnectionId, string DatabaseName, string Schema, string Name) : IQuery<string>, IConnectionRequest;

    public class GetDropProcedureScriptHandler : ConnectionRequestHandler<GetDropProcedureScriptQuery, string>
    {
        public GetDropProcedureScriptHandler(IConnectionCache cache, IDatabaseProviderFactory factory) : base(cache, factory) { }

        protected override Task<string> Handle(GetDropProcedureScriptQuery request, IDatabaseProvider provider, CancellationToken cancellationToken)
            => provider.GetDropProcedureScript(request.Schema, request.Name, cancellationToken);
    }
}
