using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.Messaging;

namespace MDBNavigator.Application.Features.DatabaseCommand.Queries.GetViewDefinition
{
    public record GetViewDefinitionQuery(string SessionId, string ConnectionId, string DatabaseName, string Schema, string Name) : IQuery<string>, IConnectionRequest;

    public class GetViewDefinitionHandler : ConnectionRequestHandler<GetViewDefinitionQuery, string>
    {
        public GetViewDefinitionHandler(IConnectionCache cache, IDatabaseProviderFactory factory) : base(cache, factory) { }

        protected override Task<string> Handle(GetViewDefinitionQuery request, IDatabaseProvider provider, CancellationToken cancellationToken)
            => provider.GetViewDefinition(request.Schema, request.Name, cancellationToken);
    }
}
