using MDBNavigator.Application.Common;

namespace MDBNavigator.API.Middleware
{
    // Headers that tell the browser to be strict with this site (README "Security headers"). Set before the rest of
    // the pipeline runs, so every response carries them: the UI's files, API answers and error responses.
    // HSTS is not here: ASP.NET Core's UseHsts already sends it only over HTTPS and not for localhost.
    public class SecurityHeadersMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly string _contentSecurityPolicy;

        public SecurityHeadersMiddleware(RequestDelegate next, CaptchaOptions captchaOptions)
        {
            _next = next;
            _contentSecurityPolicy = BuildContentSecurityPolicy(captchaOptions);
        }

        public Task InvokeAsync(HttpContext context)
        {
            var headers = context.Response.Headers;
            headers["Content-Security-Policy"] = _contentSecurityPolicy;
            headers["X-Content-Type-Options"] = "nosniff";
            headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
            headers["Cross-Origin-Opener-Policy"] = "same-origin";
            headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
            return _next(context);
        }

        // Built once at startup. With Turnstile, Cloudflare's script and iframe are allowed; otherwise nothing outside
        // this origin is.
        private static string BuildContentSecurityPolicy(CaptchaOptions captcha)
        {
            var turnstile = captcha.Provider == CaptchaProvider.Turnstile;
            const string cloudflare = "https://challenges.cloudflare.com";

            var directives = new[]
            {
                "default-src 'self'",
                turnstile ? $"script-src 'self' {cloudflare}" : "script-src 'self'",
                // Monaco and the toast notifications set inline styles. Inline styles can't run code, so this is a
                // small concession; scripts stay strict.
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data:",
                "font-src 'self' data:",
                "connect-src 'self'",
                // Monaco's and ALTCHA's workers are bundled files, never blob: URLs.
                "worker-src 'self'",
                turnstile ? $"frame-src {cloudflare}" : "frame-src 'none'",
                "object-src 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "frame-ancestors 'none'"
            };
            return string.Join("; ", directives);
        }
    }
}
