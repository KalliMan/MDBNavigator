using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.DTOs.Schema.Procedure;
using MDBNavigator.Application.Messaging;

namespace MDBNavigator.Application.Features.Schema.Queries.GetFunctions
{
    public record GetFunctionsQuery(string SessionId, string ConnectionId, string DatabaseName) : IQuery<ProceduresDetailsDto>, IConnectionRequest;

    public class GetFunctionsHandler : ConnectionRequestHandler<GetFunctionsQuery, ProceduresDetailsDto>
    {
        public GetFunctionsHandler(IConnectionCache cache, IDatabaseProviderFactory factory) : base(cache, factory) { }

        protected override async Task<ProceduresDetailsDto> Handle(GetFunctionsQuery request, IDatabaseProvider provider, CancellationToken cancellationToken)
        {
            var items = await provider.GetFunctions(cancellationToken);
            return new ProceduresDetailsDto
            {
                ConnectionId = request.ConnectionId,
                DataSource = provider.DataSource,
                DatabaseName = request.DatabaseName,
                Procedures = items
            };
        }
    }
}
