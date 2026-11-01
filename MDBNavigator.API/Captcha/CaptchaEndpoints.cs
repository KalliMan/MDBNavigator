using MDBNavigator.API.RateLimiting;
using MDBNavigator.Application.Common;
using MDBNavigator.Infrastructure.Captcha;

namespace MDBNavigator.API.Captcha
{
    public static class CaptchaEndpoints
    {
        // The solved CAPTCHA travels in a header rather than in the body: Identity's register endpoint has a fixed body,
        // and connect keeps its body for the connection settings.
        public const string TokenHeader = "Captcha-Token";

        public static void MapCaptchaEndpoints(this WebApplication app, CaptchaOptions options)
        {
            if (options.Provider != CaptchaProvider.Altcha)
            {
                return;
            }

            // Anonymous: the sign-up page needs it before there is an account. Rate limited per IP address, since each
            // challenge costs the server a PBKDF2 run.
            app.MapGet("/api/captcha/challenge", (AltchaCaptcha altcha, HttpContext http) =>
                {
                    // A challenge is used once; a cached one would be refused.
                    http.Response.Headers.CacheControl = "no-store";
                    return altcha.CreateChallenge();
                })
                .RequireRateLimiting(RateLimitPolicies.Captcha);
        }
    }
}
