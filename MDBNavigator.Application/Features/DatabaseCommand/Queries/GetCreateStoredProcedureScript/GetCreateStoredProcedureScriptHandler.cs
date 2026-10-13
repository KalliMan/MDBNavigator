using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.Messaging;
using MediatR;

namespace MDBNavigator.Application.Features.DatabaseCommand.Queries.GetCreateStoredProcedureScript
{
    public record GetCreateStoredProcedureScriptQuery(string SessionId, string ConnectionId, string DatabaseName, string Schema) : IQuery<string>;

    public class GetCreateStoredProcedureScriptHandler : IRequestHandler<GetCreateStoredProcedureScriptQuery, string>
    {
        private readonly IConnectionCache _cache;
        private readonly IDatabaseProviderFactory _factory;

        public GetCreateStoredProcedureScriptHandler(IConnectionCache cache, IDatabaseProviderFactory factory) { _cache = cache; _factory = factory; }

        public async Task<string> Handle(GetCreateStoredProcedureScriptQuery request, CancellationToken cancellationToken)
        {
            await using var provider = await DbConnectionHelper.CreateProviderAsync(_cache, _factory, request.SessionId, request.ConnectionId, request.DatabaseName);
            return provider.GetCreateStoredProcedureScript(request.Schema);
        }
    }
}

