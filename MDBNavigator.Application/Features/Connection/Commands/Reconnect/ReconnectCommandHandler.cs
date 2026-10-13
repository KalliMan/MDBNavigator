using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.DTOs;
using MDBNavigator.Domain.Exceptions;
using MediatR;

namespace MDBNavigator.Application.Features.Connection.Commands.Reconnect
{
    public class ReconnectCommandHandler : IRequestHandler<ReconnectCommand, ConnectedResultDto>
    {
        private readonly IDatabaseProviderFactory _providerFactory;
        private readonly IConnectionCache _connectionCache;

        public ReconnectCommandHandler(IDatabaseProviderFactory providerFactory, IConnectionCache connectionCache)
        {
            _providerFactory = providerFactory;
            _connectionCache = connectionCache;
        }

        public async Task<ConnectedResultDto> Handle(ReconnectCommand request, CancellationToken cancellationToken)
        {
            try
            {
                return await DbConnectionHelper.ConnectAsync(
                    _connectionCache, _providerFactory,
                    request.SessionId, request.ConnectionId,
                    request.ConnectionSettings);
            }
            catch (ConnectionFailedException)
            {
                throw;
            }
            catch (Exception ex)
            {
                throw new ConnectionFailedException("Reconnection failed!", ex);
            }
        }
    }
}

