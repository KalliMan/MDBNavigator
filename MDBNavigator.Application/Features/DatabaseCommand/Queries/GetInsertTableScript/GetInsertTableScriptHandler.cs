using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.Messaging;
using MediatR;

namespace MDBNavigator.Application.Features.DatabaseCommand.Queries.GetInsertTableScript
{
    public record GetInsertTableScriptQuery(string SessionId, string ConnectionId, string DatabaseName, string Schema, string Table) : IQuery<string>;

    public class GetInsertTableScriptHandler : IRequestHandler<GetInsertTableScriptQuery, string>
    {
        private readonly IConnectionCache _cache;
        private readonly IDatabaseProviderFactory _factory;

        public GetInsertTableScriptHandler(IConnectionCache cache, IDatabaseProviderFactory factory) { _cache = cache; _factory = factory; }

        public async Task<string> Handle(GetInsertTableScriptQuery request, CancellationToken cancellationToken)
        {
            await using var provider = await DbConnectionHelper.CreateProviderAsync(_cache, _factory, request.SessionId, request.ConnectionId, request.DatabaseName);
            return await provider.GetInsertTableScript(request.Schema, request.Table);
        }
    }
}

