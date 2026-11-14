using MDBNavigator.Connections.Contracts;
using MDBNavigator.Providers.Abstractions;
using MDBNavigator.SharedKernel.Messaging;

namespace MDBNavigator.Workbench.Application.Schema.GetFunctions
{
    public record GetFunctionsQuery(string SessionId, string ConnectionId, string DatabaseName) : IQuery<ProceduresDetailsDto>, IConnectionRequest;

    public class GetFunctionsHandler : ConnectionRequestHandler<GetFunctionsQuery, ProceduresDetailsDto>
    {
        public GetFunctionsHandler(IDatabaseConnector connector) : base(connector) { }

        protected override async Task<ProceduresDetailsDto> Handle(GetFunctionsQuery request, IDatabaseClient database, CancellationToken cancellationToken)
        {
            var items = await database.Schema.GetFunctions(cancellationToken);
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
