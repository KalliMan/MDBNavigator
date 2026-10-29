using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.DTOs;
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
            try
            {
                return await DbConnectionHelper.ConnectAsync(
                    _connectionCache, _providerFactory,
                    request.SessionId, Guid.NewGuid().ToString(),
                    request.ConnectionSettings, cancellationToken);
            }
            catch (Exception ex)
            {
                throw new ConnectionFailedException($"Connection failed: {DbConnectionHelper.DescribeConnectionError(ex)}", ex);
            }
        }
    }
}

