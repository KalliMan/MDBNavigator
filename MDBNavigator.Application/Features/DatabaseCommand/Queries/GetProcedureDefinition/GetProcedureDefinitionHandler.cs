using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.Messaging;

namespace MDBNavigator.Application.Features.DatabaseCommand.Queries.GetProcedureDefinition
{
    public record GetProcedureDefinitionQuery(string SessionId, string ConnectionId, string DatabaseName, string Schema, string Name) : IQuery<string>, IConnectionRequest;

    public class GetProcedureDefinitionHandler : ConnectionRequestHandler<GetProcedureDefinitionQuery, string>
    {
        public GetProcedureDefinitionHandler(IConnectionCache cache, IDatabaseProviderFactory factory) : base(cache, factory) { }

        protected override Task<string> Handle(GetProcedureDefinitionQuery request, IDatabaseProvider provider, CancellationToken cancellationToken)
            => provider.GetProcedureDefinition(request.Schema, request.Name, cancellationToken);
    }
}
