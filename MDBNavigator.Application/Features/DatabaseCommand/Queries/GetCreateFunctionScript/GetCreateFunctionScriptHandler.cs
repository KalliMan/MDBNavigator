using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.Messaging;
using MediatR;

namespace MDBNavigator.Application.Features.DatabaseCommand.Queries.GetCreateFunctionScript
{
    public record GetCreateFunctionScriptQuery(string SessionId, string ConnectionId, string DatabaseName, string Schema) : IQuery<string>;

    public class GetCreateFunctionScriptHandler : IRequestHandler<GetCreateFunctionScriptQuery, string>
    {
        private readonly IConnectionCache _cache;
        private readonly IDatabaseProviderFactory _factory;

        public GetCreateFunctionScriptHandler(IConnectionCache cache, IDatabaseProviderFactory factory) { _cache = cache; _factory = factory; }

        public async Task<string> Handle(GetCreateFunctionScriptQuery request, CancellationToken cancellationToken)
        {
            await using var provider = await DbConnectionHelper.CreateProviderAsync(_cache, _factory, request.SessionId, request.ConnectionId, request.DatabaseName);
            return provider.GetCreateFunctionProcedureScript(request.Schema);
        }
    }
}

