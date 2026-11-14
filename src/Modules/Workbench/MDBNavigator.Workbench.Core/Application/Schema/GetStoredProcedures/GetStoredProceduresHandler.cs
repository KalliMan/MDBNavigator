using MDBNavigator.Connections.Contracts;
using MDBNavigator.Providers.Abstractions;
using MDBNavigator.SharedKernel.Messaging;

namespace MDBNavigator.Workbench.Application.Schema.GetStoredProcedures
{
    public record GetStoredProceduresQuery(string SessionId, string ConnectionId, string DatabaseName) : IQuery<ProceduresDetailsDto>, IConnectionRequest;

    public class GetStoredProceduresHandler : ConnectionRequestHandler<GetStoredProceduresQuery, ProceduresDetailsDto>
    {
        public GetStoredProceduresHandler(IDatabaseConnector connector) : base(connector) { }

        protected override async Task<ProceduresDetailsDto> Handle(GetStoredProceduresQuery request, IDatabaseClient database, CancellationToken cancellationToken)
        {
            var items = await database.Schema.GetStoredProcedures(cancellationToken);
            return new ProceduresDetailsDto
            {
                ConnectionId = request.ConnectionId,
                DataSource = database.DataSource,
                DatabaseName = request.DatabaseName,
                Procedures = items
            };
        }
    }
}
