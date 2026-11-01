using MDBNavigator.API.Core;
using MDBNavigator.Application.Common;
using Microsoft.AspNetCore.RateLimiting;
using System.Globalization;
using System.Security.Claims;
using System.Threading.RateLimiting;

namespace MDBNavigator.API.RateLimiting
{
    // Request-rate limits (RateLimiting settings). The limits that need to know how a request ended (failed connects)
    // or what is still running (queries per user) live in the application layer instead.
    public static class RateLimitPolicies
    {
        public const string Auth = "auth";
        public const string Connect = "connect";
        public const string Query = "query";

        public static IServiceCollection AddRateLimits(this IServiceCollection services, RateLimitingOptions options)
        {
            services.AddRateLimiter(limiter =>
            {
                limiter.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
                limiter.OnRejected = (context, ct) =>
                {
                    var message = "Too many requests. Please wait a minute and try again.";
                    if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                    {
                        var seconds = Math.Max(1, (int)Math.Ceiling(retryAfter.TotalSeconds));
                        context.HttpContext.Response.Headers.RetryAfter = seconds.ToString(CultureInfo.InvariantCulture);
                        message = $"Too many requests. Please try again in {seconds} second{(seconds == 1 ? "" : "s")}.";
                    }
                    return new ValueTask(context.HttpContext.Response.WriteAsJsonAsync(
                        new ErrorResponse(StatusCodes.Status429TooManyRequests, message), ct));
                };

                // Per IP address, against password guessing (on top of the account lockout) and email flooding.
                limiter.AddPolicy(Auth, http => PerMinute(GetIpAddress(http), options.AuthRequestsPerMinute));

                // Per user: each connect opens a connection to a host the user picks, and each query occupies a worker.
                limiter.AddPolicy(Connect, http => PerMinute(GetUserOrIpAddress(http), options.ConnectsPerMinute));
                limiter.AddPolicy(Query, http => PerMinute(GetUserOrIpAddress(http), options.QueriesPerMinute));
            });

            return services;
        }

        private static RateLimitPartition<string> PerMinute(string key, int permitLimit) => permitLimit > 0
            ? RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = permitLimit,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            })
            : RateLimitPartition.GetNoLimiter(key);

        private static string GetIpAddress(HttpContext http) => http.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        // The signed-in user, so people behind one shared address (an office, a VPN) don't share a limit. Without
        // sign-in (Auth:Mode None) there is no user, and the address stands in.
        private static string GetUserOrIpAddress(HttpContext http)
            => http.User.FindFirstValue(ClaimTypes.NameIdentifier) is { } userId
                ? $"user:{userId}"
                : $"ip:{GetIpAddress(http)}";
    }
}
