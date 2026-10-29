using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.DTOs.Schema.Procedure;
using MDBNavigator.Application.Messaging;

namespace MDBNavigator.Application.Features.Schema.Queries.GetStoredProcedures
{
    public record GetStoredProceduresQuery(string SessionId, string ConnectionId, string DatabaseName) : IQuery<ProceduresDetailsDto>, IConnectionRequest;

    public class GetStoredProceduresHandler : ConnectionRequestHandler<GetStoredProceduresQuery, ProceduresDetailsDto>
    {
        public GetStoredProceduresHandler(IConnectionCache cache, IDatabaseProviderFactory factory) : base(cache, factory) { }

        protected override async Task<ProceduresDetailsDto> Handle(GetStoredProceduresQuery request, IDatabaseProvider provider, CancellationToken cancellationToken)
        {
            var items = await provider.GetStoredProcedures(cancellationToken);
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
