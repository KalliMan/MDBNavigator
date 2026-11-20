using MDBNavigator.Accounts.Demo;
using MDBNavigator.API.Core;
using MDBNavigator.SharedKernel.Violations;
using Microsoft.AspNetCore.RateLimiting;
using System.Globalization;
using System.Security.Claims;
using System.Threading.RateLimiting;

namespace MDBNavigator.API.RateLimiting
{
    // Request-rate limits (RateLimiting settings). The limits that need to know how a request ended (failed connects)
    // or what is still running (queries per user) live in the connections and workbench modules instead.
    public static class RateLimitPolicies
    {
        public const string Auth = "auth";
        public const string Connect = "connect";
        public const string Query = "query";
        public const string Captcha = "captcha";
        public const string DemoLink = "demo-link";

        public static IServiceCollection AddRateLimits(this IServiceCollection services, RateLimitingOptions options, DemoOptions demo)
        {
            services.AddRateLimiter(limiter =>
            {
                limiter.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
                limiter.OnRejected = async (context, ct) =>
                {
                    await RecordViolationAsync(context.HttpContext);

                    var message = "Too many requests. Please wait a minute and try again.";
                    if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                    {
                        var seconds = Math.Max(1, (int)Math.Ceiling(retryAfter.TotalSeconds));
                        context.HttpContext.Response.Headers.RetryAfter = seconds.ToString(CultureInfo.InvariantCulture);
                        // The demo's hourly limits can be most of an hour away.
                        var minutes = (seconds + 59) / 60;
                        message = seconds < 120
                            ? $"Too many requests. Please try again in {seconds} second{(seconds == 1 ? "" : "s")}."
                            : $"Too many requests. Please try again in {minutes} minutes.";
                    }
                    await context.HttpContext.Response.WriteAsJsonAsync(
                        new ErrorResponse(StatusCodes.Status429TooManyRequests, message), ct);
                };

                // Per IP address, against password guessing (on top of the account lockout) and email flooding.
                limiter.AddPolicy(Auth, http => PerMinute(GetIpAddress(http), options.AuthRequestsPerMinute));
                // ALTCHA challenges: per IP address too (the sign-up page has no user yet), with a limit of its own, so
                // a widget fetching a new challenge doesn't use up the sign-in attempts.
                limiter.AddPolicy(Captcha, http => PerMinute(GetIpAddress(http), options.AuthRequestsPerMinute));
                // Demo link requests send email: per IP address and hour, on top of the CAPTCHA and the limit per
                // recipient (DemoAccess), so one address can't make the server mail many people.
                limiter.AddPolicy(DemoLink, http => Fixed(GetIpAddress(http), demo.LinkRequestsPerIpPerHour, TimeSpan.FromHours(1)));

                // Per user: each connect opens a connection to a host the user picks, and each query occupies a worker.
                limiter.AddPolicy(Connect, http => PerMinute(GetUserOrIpAddress(http), options.ConnectsPerMinute));
                limiter.AddPolicy(Query, http => PerMinute(GetUserOrIpAddress(http), options.QueriesPerMinute));
            });

            return services;
        }

        // The public demo counts a signed-in user's refused connects and queries against a guest (DemoViolations). The
        // per-address policies (sign-in, CAPTCHA, demo links) come before anyone is signed in, so they don't count.
        private static async Task RecordViolationAsync(HttpContext http)
        {
            var policy = http.GetEndpoint()?.Metadata.GetMetadata<EnableRateLimitingAttribute>()?.PolicyName;
            if (policy is Connect or Query
                && http.RequestServices.GetService<IViolationRecorder>() is { } violations
                && http.User.FindFirstValue(ClaimTypes.NameIdentifier) is { } userId)
            {
                await violations.RecordAsync(userId, ViolationKind.LimitReached);
            }
        }

        private static RateLimitPartition<string> PerMinute(string key, int permitLimit) => Fixed(key, permitLimit, TimeSpan.FromMinutes(1));

        private static RateLimitPartition<string> Fixed(string key, int permitLimit, TimeSpan window) => permitLimit > 0
            ? RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = permitLimit,
                Window = window,
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
