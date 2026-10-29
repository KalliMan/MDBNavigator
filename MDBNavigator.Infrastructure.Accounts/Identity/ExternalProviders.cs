using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.OAuth;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;

namespace MDBNavigator.Infrastructure.Accounts.Identity
{
    // Google, Microsoft and GitHub sign-in. Each is switched on only when "Authentication:{Provider}:ClientId" and
    // "ClientSecret" are configured, so adding one is a configuration change. The provider's app must allow the
    // return address https://{host}/api/auth/signin-{google|microsoft|github}.
    public static class ExternalProviders
    {
        // Scheme names; they are also the provider names the UI shows and sends back.
        public const string Google = "Google";
        public const string Microsoft = "Microsoft";
        public const string GitHub = "GitHub";

        // Shown on the sign-in page (/login?error=...).
        public const string CancelledError = "external-cancelled";
        public const string FailedError = "external-failed";

        private const string EmailVerifiedClaim = "email_verified";

        public static AuthenticationBuilder AddExternalProviders(this AuthenticationBuilder auth, IConfiguration configuration)
        {
            if (Credentials(configuration, Google) is { } google)
            {
                auth.AddGoogle(options =>
                {
                    Configure(options, google, "/api/auth/signin-google");
                    // The handler's userinfo endpoint (v2) calls it "verified_email"; the OpenID form is "email_verified".
                    options.ClaimActions.MapJsonKey(EmailVerifiedClaim, "verified_email");
                    options.ClaimActions.MapJsonKey(EmailVerifiedClaim, "email_verified");
                });
            }

            if (Credentials(configuration, Microsoft) is { } microsoft)
            {
                auth.AddMicrosoftAccount(options => Configure(options, microsoft, "/api/auth/signin-microsoft"));
            }

            if (Credentials(configuration, GitHub) is { } github)
            {
                auth.AddGitHub(options =>
                {
                    Configure(options, github, "/api/auth/signin-github");
                    // Without it, GitHub sends an email only when the user made one public.
                    options.Scope.Add("user:email");
                });
            }

            return auth;
        }

        // Whether the provider vouches that this person owns the email address.
        public static bool IsEmailVerified(ExternalLoginInfo info) => info.LoginProvider switch
        {
            Google => bool.TryParse(info.Principal.FindFirstValue(EmailVerifiedClaim), out var verified) && verified,
            // GitHub's public email must be verified, and the user:email scope returns only the primary verified address.
            GitHub => true,
            // Microsoft work accounts can carry an email address their organization never verified.
            _ => false
        };

        private sealed record ProviderCredentials(string ClientId, string ClientSecret);

        private static ProviderCredentials? Credentials(IConfiguration configuration, string provider)
        {
            var section = configuration.GetSection($"Authentication:{provider}");
            var (id, secret) = (section["ClientId"], section["ClientSecret"]);
            return string.IsNullOrWhiteSpace(id) || string.IsNullOrWhiteSpace(secret) ? null : new(id, secret);
        }

        private static void Configure(OAuthOptions options, ProviderCredentials credentials, string callbackPath)
        {
            options.ClientId = credentials.ClientId;
            options.ClientSecret = credentials.ClientSecret;
            options.SignInScheme = IdentityConstants.ExternalScheme;

            // Under /api, so the Vite dev proxy forwards it like every other API call.
            options.CallbackPath = callbackPath;

            // The provider sends the browser back with a top-level GET, which carries Lax cookies. The default (None)
            // requires HTTPS, so on http://localhost the cookie would be dropped and sign-in would fail.
            options.CorrelationCookie.SameSite = SameSiteMode.Lax;

            // Cancelled at the provider, or anything else gone wrong: back to the sign-in page with a message, not a 500.
            options.Events.OnAccessDenied = context => RedirectToLogin(context, CancelledError);
            options.Events.OnRemoteFailure = context => RedirectToLogin(context, FailedError);
        }

        private static Task RedirectToLogin<TOptions>(HandleRequestContext<TOptions> context, string error)
            where TOptions : RemoteAuthenticationOptions
        {
            context.Response.Redirect($"/login?error={error}");
            context.HandleResponse();
            return Task.CompletedTask;
        }
    }
}
