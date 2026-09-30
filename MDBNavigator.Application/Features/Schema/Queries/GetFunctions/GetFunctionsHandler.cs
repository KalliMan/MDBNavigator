using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.DTOs.Schema.Procedure;
using MDBNavigator.Application.Messaging;
using MediatR;

namespace MDBNavigator.Application.Features.Schema.Queries.GetFunctions
{
    public record GetFunctionsQuery(string SessionId, string ConnectionId, string DatabaseName) : IQuery<ProceduresDetailsDto>;

    public class GetFunctionsHandler : IRequestHandler<GetFunctionsQuery, ProceduresDetailsDto>
    {
        private readonly IConnectionCache _cache;
        private readonly IDatabaseProviderFactory _factory;

        public GetFunctionsHandler(IConnectionCache cache, IDatabaseProviderFactory factory)
        {
            _cache = cache;
            _factory = factory;
        }

        public async Task<ProceduresDetailsDto> Handle(GetFunctionsQuery request, CancellationToken cancellationToken)
        {
            await using var provider = await HandlerHelper.CreateProviderAsync(_cache, _factory, request.SessionId, request.ConnectionId, request.DatabaseName);
            var functions = await provider.GetFunctions();
            return new ProceduresDetailsDto
            {
                ConnectionId = request.ConnectionId,
                DataSource = provider.DataSource,
                DatabaseName = request.DatabaseName,
                Procedures = functions
            };
        }
    }
}
