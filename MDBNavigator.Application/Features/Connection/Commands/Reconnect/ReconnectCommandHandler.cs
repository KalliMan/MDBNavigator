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
        private readonly IConnectAttemptLimiter _attemptLimiter;
        private readonly ICaptchaVerifier _captcha;

        public ReconnectCommandHandler(IDatabaseProviderFactory providerFactory, IConnectionCache connectionCache, IConnectAttemptLimiter attemptLimiter,
            ICaptchaVerifier captcha)
        {
            _providerFactory = providerFactory;
            _connectionCache = connectionCache;
            _attemptLimiter = attemptLimiter;
            _captcha = captcha;
        }

        public async Task<ConnectedResultDto> Handle(ReconnectCommand request, CancellationToken cancellationToken)
        {
            try
            {
                return await DbConnectionHelper.ConnectAsync(
                    _connectionCache, _providerFactory, _attemptLimiter, _captcha,
                    request.SessionId, request.ConnectionId,
                    request.ConnectionSettings, request.CaptchaToken, cancellationToken);
            }
            catch (Exception ex) when (ex is ConnectionFailedException or TooManyRequestsException or CaptchaRequiredException)
            {
                throw;
            }
            catch (Exception ex)
            {
                throw new ConnectionFailedException($"Reconnection failed: {DbConnectionHelper.DescribeConnectionError(ex)}", ex);
            }
        }
    }
}

