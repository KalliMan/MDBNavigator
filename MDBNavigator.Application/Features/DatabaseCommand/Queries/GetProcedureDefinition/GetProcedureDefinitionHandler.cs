using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.Messaging;
using MediatR;

namespace MDBNavigator.Application.Features.DatabaseCommand.Queries.GetProcedureDefinition
{
    public record GetProcedureDefinitionQuery(string SessionId, string ConnectionId, string DatabaseName, string Schema, string Name) : IQuery<string>;

    public class GetProcedureDefinitionHandler : IRequestHandler<GetProcedureDefinitionQuery, string>
    {
        private readonly IConnectionCache _cache;
        private readonly IDatabaseProviderFactory _factory;

        public GetProcedureDefinitionHandler(IConnectionCache cache, IDatabaseProviderFactory factory) { _cache = cache; _factory = factory; }

        public async Task<string> Handle(GetProcedureDefinitionQuery request, CancellationToken cancellationToken)
        {
            await using var provider = await HandlerHelper.CreateProviderAsync(_cache, _factory, request.SessionId, request.ConnectionId, request.DatabaseName);
            return await provider.GetProcedureDefinition(request.Schema, request.Name);
        }
    }
}
