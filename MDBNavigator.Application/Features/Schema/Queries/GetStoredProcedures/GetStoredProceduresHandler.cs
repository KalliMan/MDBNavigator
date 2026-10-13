using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.DTOs.Schema.Procedure;
using MDBNavigator.Application.Messaging;
using MediatR;

namespace MDBNavigator.Application.Features.Schema.Queries.GetStoredProcedures
{
    public record GetStoredProceduresQuery(string SessionId, string ConnectionId, string DatabaseName) : IQuery<ProceduresDetailsDto>;

    public class GetStoredProceduresHandler : IRequestHandler<GetStoredProceduresQuery, ProceduresDetailsDto>
    {
        private readonly IConnectionCache _cache;
        private readonly IDatabaseProviderFactory _factory;

        public GetStoredProceduresHandler(IConnectionCache cache, IDatabaseProviderFactory factory)
        {
            _cache = cache;
            _factory = factory;
        }

        public async Task<ProceduresDetailsDto> Handle(GetStoredProceduresQuery request, CancellationToken cancellationToken)
        {
            await using var provider = await DbConnectionHelper.CreateProviderAsync(_cache, _factory, request.SessionId, request.ConnectionId, request.DatabaseName);
            var procedures = await provider.GetStoredProcedures();
            return new ProceduresDetailsDto
            {
                ConnectionId = request.ConnectionId,
                DataSource = provider.DataSource,
                DatabaseName = request.DatabaseName,
                Procedures = procedures
            };
        }
    }
}

