using MDBNavigator.Providers.Abstractions;
using MDBNavigator.SharedKernel;
using MDBNavigator.SharedKernel.Captcha;
using MDBNavigator.SharedKernel.Errors;

namespace MDBNavigator.Connections.Application
{
    // Connect and reconnect both come here, so both count towards the failed-connect wait. Every failure counts
    // (wrong password, unreachable host, refused by the connection guard): each one tells a prober something.
    public class ConnectionOpener
    {
        private readonly IConnectionCache _cache;
        private readonly DatabaseConnector _connector;
        private readonly IConnectAttemptLimiter _limiter;
        private readonly ICaptchaVerifier _captcha;

        public ConnectionOpener(IConnectionCache cache, DatabaseConnector connector, IConnectAttemptLimiter limiter, ICaptchaVerifier captcha)
        {
            _cache = cache;
            _connector = connector;
            _limiter = limiter;
            _captcha = captcha;
        }

        // The provider's message says why (e.g. "password authentication failed for user ..."). Network errors
        // are wrapped ("Failed to connect to host:port") with the actual cause ("connection refused") inside.
        public static string DescribeConnectionError(Exception ex)
            => ex.InnerException is { Message.Length: > 0 } inner && !ex.Message.Contains(inner.Message)
                ? $"{ex.Message} ({inner.Message})"
                : ex.Message;

        public async Task<ConnectedResultDto> ConnectAsync(
            string sessionId,
            string connectionId,
            ConnectionSettings settings,
            string? captchaToken,
            CancellationToken ct = default)
        {
            var userId = SessionKey.UserIdOf(sessionId);
            if (_limiter.GetWait(userId) is { } wait)
            {
                await RequireCaptchaOrWaitAsync(captchaToken, wait, ct);
            }

            try
            {
                await using var database = await _connector.OpenAsync(settings, ct: ct);
            }
            catch (Exception) when (!ct.IsCancellationRequested)
            {
                // Not when the client went away: that says nothing about the host or the password.
                _limiter.RecordFailure(userId);
                throw;
            }
            _cache.Set(sessionId, connectionId, settings);

            return new ConnectedResultDto
            {
                ConnectionId = connectionId,
                ConnectionName = $"{settings.ServerName}:{settings.Port}",
                ServerName = settings.ServerName,
                Port = settings.Port,
                ServerType = ServerTypes.NameOf(settings.ServerType),
                UserName = settings.UserName,
                DatabaseName = settings.DatabaseName
            };
        }

        // With a CAPTCHA configured, it replaces the wait: every connect needs a newly solved one until the wait is over,
        // so each further guess costs a person's attention (Turnstile) or seconds of computing (ALTCHA). A successful
        // connect doesn't end the wait early, for the same reason it doesn't reset the failure count.
        private async Task RequireCaptchaOrWaitAsync(string? token, TimeSpan wait, CancellationToken ct)
        {
            if (!_captcha.Enabled)
            {
                var minutes = (int)Math.Ceiling(wait.TotalMinutes);
                throw new TooManyRequestsException(
                    $"Too many failed connection attempts. Please try again in {minutes} minute{(minutes == 1 ? "" : "s")}.", wait);
            }

            if (string.IsNullOrEmpty(token))
            {
                throw new CaptchaRequiredException("Too many failed connection attempts. Please complete the CAPTCHA to try again.");
            }
            if (!await _captcha.VerifyAsync(token, ct))
            {
                throw new CaptchaRequiredException("The CAPTCHA check didn't pass. Please try it again.");
            }
        }
    }
}
