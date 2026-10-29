using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.Messaging;

namespace MDBNavigator.Application.Features.DatabaseCommand.Queries.GetCreateFunctionScript
{
    public record GetCreateFunctionScriptQuery(string SessionId, string ConnectionId, string DatabaseName, string Schema) : IQuery<string>, IConnectionRequest;

    public class GetCreateFunctionScriptHandler : ConnectionRequestHandler<GetCreateFunctionScriptQuery, string>
    {
        public GetCreateFunctionScriptHandler(IConnectionCache cache, IDatabaseProviderFactory factory) : base(cache, factory) { }

        protected override Task<string> Handle(GetCreateFunctionScriptQuery request, IDatabaseProvider provider, CancellationToken cancellationToken)
            => Task.FromResult(provider.GetCreateFunctionProcedureScript(request.Schema));
    }
}
