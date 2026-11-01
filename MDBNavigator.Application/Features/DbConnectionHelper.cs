using MDBNavigator.Application.Common;
using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.DTOs;
using MDBNavigator.Domain.Exceptions;
using MDBNavigator.Domain.ValueObjects;

namespace MDBNavigator.Application.Features
{
    internal static class DbConnectionHelper
    {
        internal static string GetCacheKey(string sessionId, string connectionId)
            => $"{sessionId}_{connectionId}";

        // The provider's message says why (e.g. "password authentication failed for user ..."). Network errors
        // are wrapped ("Failed to connect to host:port") with the actual cause ("connection refused") inside.
        internal static string DescribeConnectionError(Exception ex)
            => ex.InnerException is { Message.Length: > 0 } inner && !ex.Message.Contains(inner.Message)
                ? $"{ex.Message} ({inner.Message})"
                : ex.Message;

        // Connect and reconnect both come here, so both count towards the failed-connect wait. Every failure counts
        // (wrong password, unreachable host, refused by the connection guard): each one tells a prober something.
        internal static async Task<ConnectedResultDto> ConnectAsync(
            IConnectionCache cache,
            IDatabaseProviderFactory factory,
            IConnectAttemptLimiter limiter,
            ICaptchaVerifier captcha,
            string sessionId,
            string connectionId,
            ConnectionSettings settings,
            string? captchaToken,
            CancellationToken ct = default)
        {
            var userId = SessionKey.UserIdOf(sessionId);
            if (limiter.GetWait(userId) is { } wait)
            {
                await RequireCaptchaOrWaitAsync(captcha, captchaToken, wait, ct);
            }

            try
            {
                await using var provider = await factory.CreateAsync(settings, ct: ct);
            }
            catch (Exception) when (!ct.IsCancellationRequested)
            {
                // Not when the client went away: that says nothing about the host or the password.
                limiter.RecordFailure(userId);
                throw;
            }
            cache.Set(GetCacheKey(sessionId, connectionId), settings);

            return new ConnectedResultDto
            {
                ConnectionId = connectionId,
                ConnectionName = $"{settings.ServerName}:{settings.Port}",
                ServerName = settings.ServerName,
                Port = settings.Port,
                ServerType = settings.ServerType,
                UserName = settings.UserName
            };
        }

        // With a CAPTCHA configured, it replaces the wait: every connect needs a newly solved one until the wait is over,
        // so each further guess costs a person's attention (Turnstile) or seconds of computing (ALTCHA). A successful
        // connect doesn't end the wait early, for the same reason it doesn't reset the failure count.
        private static async Task RequireCaptchaOrWaitAsync(ICaptchaVerifier captcha, string? token, TimeSpan wait, CancellationToken ct)
        {
            if (!captcha.Enabled)
            {
                var minutes = (int)Math.Ceiling(wait.TotalMinutes);
                throw new TooManyRequestsException(
                    $"Too many failed connection attempts. Please try again in {minutes} minute{(minutes == 1 ? "" : "s")}.", wait);
            }

            if (string.IsNullOrEmpty(token))
            {
                throw new CaptchaRequiredException("Too many failed connection attempts. Please complete the CAPTCHA to try again.");
            }
            if (!await captcha.VerifyAsync(token, ct))
            {
                throw new CaptchaRequiredException("The CAPTCHA check didn't pass. Please try it again.");
            }
        }

        // Creates a scoped DB provider for the connection identified by sessionId + connectionId.
        internal static async Task<IDatabaseProvider> CreateProviderAsync(
            IConnectionCache cache,
            IDatabaseProviderFactory factory,
            string sessionId,
            string connectionId,
            string? databaseName = null,
            CancellationToken ct = default)
        {
            var key = GetCacheKey(sessionId, connectionId);
            if (!cache.TryGet(key, out var settings) || settings is null)
            {
                throw new NotConnectedException("Not Connected! Please reconnect.");
            }

            return await factory.CreateAsync(settings, databaseName, ct);
        }
    }
}

