using MDBNavigator.Application.Common;
using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.DTOs;
using MDBNavigator.Application.Features.SavedConnections;
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
        private readonly ISavedConnectionStore _store;
        private readonly ISavedPasswordProtector _passwords;

        public ConnectCommandHandler(IDatabaseProviderFactory providerFactory, IConnectionCache connectionCache, IConnectAttemptLimiter attemptLimiter,
            ICaptchaVerifier captcha, ISavedConnectionStore store, ISavedPasswordProtector passwords)
        {
            _providerFactory = providerFactory;
            _connectionCache = connectionCache;
            _attemptLimiter = attemptLimiter;
            _captcha = captcha;
            _store = store;
            _passwords = passwords;
        }

        public async Task<ConnectedResultDto> Handle(ConnectCommand request, CancellationToken cancellationToken)
        {
            // Before the try, so a 404 or 400 from it isn't wrapped as "Connection failed". No connection is attempted
            // here, so it doesn't count towards the failed-connect wait either.
            var (settings, usedSavedConnectionId) = await RememberedPassword.ResolveAsync(_store, _passwords,
                SessionKey.UserIdOf(request.SessionId), request.ConnectionSettings, request.SavedConnectionId, cancellationToken);

            try
            {
                var result = await DbConnectionHelper.ConnectAsync(
                    _connectionCache, _providerFactory, _attemptLimiter, _captcha,
                    request.SessionId, Guid.NewGuid().ToString(),
                    settings, request.CaptchaToken, cancellationToken);
                result.SavedConnectionId = usedSavedConnectionId;
                return result;
            }
            catch (Exception ex) when (ex is not TooManyRequestsException and not CaptchaRequiredException)
            {
                throw new ConnectionFailedException($"Connection failed: {DbConnectionHelper.DescribeConnectionError(ex)}", ex);
            }
        }
    }
}

