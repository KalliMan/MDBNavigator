using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.Messaging;
using MediatR;

namespace MDBNavigator.Application.Features.DatabaseCommand.Queries.GetDropProcedureScript
{
    public record GetDropProcedureScriptQuery(string SessionId, string ConnectionId, string DatabaseName, string Schema, string Name) : IQuery<string>;

    public class GetDropProcedureScriptHandler : IRequestHandler<GetDropProcedureScriptQuery, string>
    {
        private readonly IConnectionCache _cache;
        private readonly IDatabaseProviderFactory _factory;

        public GetDropProcedureScriptHandler(IConnectionCache cache, IDatabaseProviderFactory factory) { _cache = cache; _factory = factory; }

        public async Task<string> Handle(GetDropProcedureScriptQuery request, CancellationToken cancellationToken)
        {
            await using var provider = await HandlerHelper.CreateProviderAsync(_cache, _factory, request.SessionId, request.ConnectionId, request.DatabaseName);
            return provider.GetDropProcedureScript(request.Schema, request.Name);
        }
    }
}
