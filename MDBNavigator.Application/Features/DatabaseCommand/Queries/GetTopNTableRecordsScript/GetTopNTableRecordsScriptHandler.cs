using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.Messaging;
using MediatR;

namespace MDBNavigator.Application.Features.DatabaseCommand.Queries.GetTopNTableRecordsScript
{
    public record GetTopNTableRecordsScriptQuery(string SessionId, string ConnectionId, string Id, string DatabaseName, string Schema, string Table, int? RecordsNumber)
        : IQuery<string>;

    public class GetTopNTableRecordsScriptHandler : IRequestHandler<GetTopNTableRecordsScriptQuery, string>
    {
        private readonly IConnectionCache _cache;
        private readonly IDatabaseProviderFactory _factory;

        public GetTopNTableRecordsScriptHandler(IConnectionCache cache, IDatabaseProviderFactory factory) { _cache = cache; _factory = factory; }

        public async Task<string> Handle(GetTopNTableRecordsScriptQuery request, CancellationToken cancellationToken)
        {
            await using var provider = await DbConnectionHelper.CreateProviderAsync(_cache, _factory, request.SessionId, request.ConnectionId, request.DatabaseName);
            return provider.GetTopNTableRecordsScript(request.Schema, request.Table, request.RecordsNumber);
        }
    }
}
