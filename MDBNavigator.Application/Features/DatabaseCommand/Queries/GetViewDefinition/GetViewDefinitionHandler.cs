using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.Messaging;
using MediatR;

namespace MDBNavigator.Application.Features.DatabaseCommand.Queries.GetViewDefinition
{
    public record GetViewDefinitionQuery(string SessionId, string ConnectionId, string DatabaseName, string Schema, string Name) : IQuery<string>;

    public class GetViewDefinitionHandler : IRequestHandler<GetViewDefinitionQuery, string>
    {
        private readonly IConnectionCache _cache;
        private readonly IDatabaseProviderFactory _factory;

        public GetViewDefinitionHandler(IConnectionCache cache, IDatabaseProviderFactory factory) { _cache = cache; _factory = factory; }

        public async Task<string> Handle(GetViewDefinitionQuery request, CancellationToken cancellationToken)
        {
            await using var provider = await DbConnectionHelper.CreateProviderAsync(_cache, _factory, request.SessionId, request.ConnectionId, request.DatabaseName);
            return await provider.GetViewDefinition(request.Schema, request.Name);
        }
    }
}

