using MDBNavigator.API.Core;
using MDBNavigator.Infrastructure.Accounts;
using System.Threading.RateLimiting;

namespace MDBNavigator.API.Auth
{
    public static class AuthServiceExtensions
    {
        public const string AuthRateLimitPolicy = "auth";

        public static IServiceCollection AddAuth(this IServiceCollection services, AuthOptions options, IConfiguration configuration, IHostEnvironment environment)
        {
            services.AddSingleton(options);

            if (options.Mode == AuthMode.Accounts)
            {
                services.AddAccounts(configuration, environment);
            }
            else
            {
                // No schemes: nobody signs in, but the authentication middleware still needs its services.
                services.AddAuthentication();
            }
            services.AddAuthorization();

            // Per IP address, against password guessing (on top of the account lockout) and, later, email flooding.
            var authPerMinute = configuration.GetValue("RateLimiting:AuthRequestsPerMinute", 10);
            services.AddRateLimiter(limiter =>
            {
                limiter.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
                limiter.OnRejected = (context, ct) => new ValueTask(context.HttpContext.Response.WriteAsJsonAsync(
                    new ErrorResponse(StatusCodes.Status429TooManyRequests, "Too many attempts. Please wait a minute and try again."), ct));

                limiter.AddPolicy(AuthRateLimitPolicy, http => RateLimitPartition.GetFixedWindowLimiter(
                    http.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = authPerMinute,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0
                    }));
            });

            return services;
        }
    }
}
