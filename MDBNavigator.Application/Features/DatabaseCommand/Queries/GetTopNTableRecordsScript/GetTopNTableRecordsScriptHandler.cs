using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.Messaging;

namespace MDBNavigator.Application.Features.DatabaseCommand.Queries.GetTopNTableRecordsScript
{
    public record GetTopNTableRecordsScriptQuery(string SessionId, string ConnectionId, string DatabaseName, string Schema, string Table, int? RecordsNumber) : IQuery<string>, IConnectionRequest;

    public class GetTopNTableRecordsScriptHandler : ConnectionRequestHandler<GetTopNTableRecordsScriptQuery, string>
    {
        public GetTopNTableRecordsScriptHandler(IConnectionCache cache, IDatabaseProviderFactory factory) : base(cache, factory) { }

        protected override Task<string> Handle(GetTopNTableRecordsScriptQuery request, IDatabaseProvider provider, CancellationToken cancellationToken)
            => Task.FromResult(provider.GetTopNTableRecordsScript(request.Schema, request.Table, request.RecordsNumber));
    }
}
