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
        private readonly IConnectAttemptLimiter _attemptLimiter;
        private readonly ICaptchaVerifier _captcha;

        public ConnectCommandHandler(IDatabaseProviderFactory providerFactory, IConnectionCache connectionCache, IConnectAttemptLimiter attemptLimiter,
            ICaptchaVerifier captcha)
        {
            _providerFactory = providerFactory;
            _connectionCache = connectionCache;
            _attemptLimiter = attemptLimiter;
            _captcha = captcha;
        }

        public async Task<ConnectedResultDto> Handle(ConnectCommand request, CancellationToken cancellationToken)
        {
            try
            {
                return await DbConnectionHelper.ConnectAsync(
                    _connectionCache, _providerFactory, _attemptLimiter, _captcha,
                    request.SessionId, Guid.NewGuid().ToString(),
                    request.ConnectionSettings, request.CaptchaToken, cancellationToken);
            }
            catch (Exception ex) when (ex is not TooManyRequestsException and not CaptchaRequiredException)
            {
                throw new ConnectionFailedException($"Connection failed: {DbConnectionHelper.DescribeConnectionError(ex)}", ex);
            }
        }
    }
}

