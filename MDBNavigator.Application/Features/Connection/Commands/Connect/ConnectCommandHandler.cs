using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.DTOs;
using MDBNavigator.Domain.Enums;
using MDBNavigator.Domain.Exceptions;
using MediatR;

namespace MDBNavigator.Application.Features.Connection.Commands.Connect
{
    public class ConnectCommandHandler : IRequestHandler<ConnectCommand, ConnectedResultDto>
    {
        private readonly IDatabaseProviderFactory _providerFactory;
        private readonly IConnectionCache _connectionCache;

        public ConnectCommandHandler(IDatabaseProviderFactory providerFactory, IConnectionCache connectionCache)
        {
            _providerFactory = providerFactory;
            _connectionCache = connectionCache;
        }

        public async Task<ConnectedResultDto> Handle(ConnectCommand request, CancellationToken cancellationToken)
        {
            var connectionId = Guid.NewGuid().ToString();
            try
            {
                return await ConnectInternal(request.SessionId, connectionId, request.ConnectionSettings);
            }
            catch (Exception ex)
            {
                throw new ConnectionFailedException("Connection failed!", ex);
            }
        }

        internal async Task<ConnectedResultDto> ConnectInternal(string sessionId, string connectionId, Domain.ValueObjects.ConnectionSettings settings)
        {
            await using var provider = await _providerFactory.CreateAsync(settings);
            var cacheKey = GetCacheKey(sessionId, connectionId);
            _connectionCache.Set(cacheKey, settings);

            var serverType = settings.ServerType switch
            {
                "PostgreSQL" => ServerType.PostgreSQL,
                "MS SQL Server" => ServerType.MSSQLServer,
                _ => ServerType.None
            };

            return new ConnectedResultDto
            {
                ConnectionId = connectionId,
                ConnectionName = $"{settings.ServerName}:{settings.Port}",
                ServerName = settings.ServerName,
                Port = settings.Port,
                ServerType = serverType,
                UserName = settings.UserName
            };
        }

        internal static string GetCacheKey(string sessionId, string connectionId)
            => $"{sessionId}_{connectionId}";
    }
}
