using MDBNavigator.API.Core;
using MDBNavigator.API.DTOs;
using MDBNavigator.Infrastructure.Accounts;
using MDBNavigator.Infrastructure.Accounts.Identity;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace MDBNavigator.API.Auth
{
    // /api/auth. Minimal APIs rather than a controller, because Identity's own endpoints (login, register, password
    // reset, ...) are minimal APIs, and which endpoints exist depends on Auth:Mode.
    public static class AuthEndpoints
    {
        public static void MapAuthEndpoints(this WebApplication app, AuthOptions options)
        {
            var auth = app.MapGroup("/api/auth");

            if (options.Mode != AuthMode.Accounts)
            {
                auth.MapGet("settings", () => new AuthSettingsDto(options.Mode.ToString(), options.SignUp.ToString(), []));
                return;
            }

            auth.MapGet("settings", async (ExternalLogins logins) =>
                new AuthSettingsDto(options.Mode.ToString(), options.SignUp.ToString(), await logins.GetProvidersAsync()));

            // Identity's endpoints: login (?useCookies=true for the web session), register, confirmEmail,
            // resendConfirmationEmail, forgotPassword, resetPassword, manage/info, ...
            app.MapGroup("/api/auth")
                .RequireRateLimiting(AuthServiceExtensions.AuthRateLimitPolicy)
                .AddEndpointFilter(async (context, next) =>
                    options.SignUp == SignUpMode.Closed && IsRegister(context.HttpContext.Request)
                        ? Results.Json(
                            new ErrorResponse(StatusCodes.Status403Forbidden, "Creating accounts is switched off on this server."),
                            statusCode: StatusCodes.Status403Forbidden)
                        : await next(context))
                .MapIdentityApi<ApplicationUser>();

            auth.MapGet("me", async (ClaimsPrincipal principal, UserManager<ApplicationUser> users) =>
                    await users.GetUserAsync(principal) is { } user
                        ? Results.Ok(new CurrentUserDto(user.Email ?? string.Empty, await users.IsInRoleAsync(user, RoleNames.Admin)))
                        // The cookie is valid but the account is gone.
                        : Results.Unauthorized())
                .RequireAuthorization();

            // Allowed without a valid session, so a stale cookie can always be cleared.
            auth.MapPost("logout", async (SignInManager<ApplicationUser> signInManager) =>
            {
                await signInManager.SignOutAsync();
                return Results.NoContent();
            });

            MapExternalSignIn(auth, options);
        }

        // Sign-in with Google/Microsoft/GitHub. The browser navigates here (a link, not a fetch call), goes to the
        // provider, comes back to the provider's return path (/api/auth/signin-..., handled by ASP.NET Core), then to
        // the callback, which redirects to the app or to the sign-in page with an error code.
        private static void MapExternalSignIn(RouteGroupBuilder auth, AuthOptions options)
        {
            auth.MapGet("external/{provider}", async (string provider, string? returnTo, ExternalLogins logins) =>
                {
                    var scheme = await logins.FindProviderAsync(provider);
                    if (scheme is null)
                    {
                        return Results.Redirect(LoginPage(ExternalProviders.FailedError, returnTo));
                    }

                    var callback = $"/api/auth/external/callback?returnTo={Uri.EscapeDataString(ReturnUrl.Sanitize(returnTo))}";
                    return Results.Challenge(logins.CreateChallenge(scheme, callback), [scheme]);
                })
                .RequireRateLimiting(AuthServiceExtensions.AuthRateLimitPolicy);

            auth.MapGet("external/callback", async (string? returnTo, ExternalLogins logins) =>
                {
                    // Closed sign-up: existing accounts can still sign in through a provider, new ones aren't created.
                    var result = await logins.CompleteAsync(allowNewAccounts: options.SignUp == SignUpMode.Open);
                    return Results.Redirect(result == ExternalLoginResult.Success
                        ? ReturnUrl.Sanitize(returnTo)
                        : LoginPage(ErrorCode(result), returnTo));
                })
                .RequireRateLimiting(AuthServiceExtensions.AuthRateLimitPolicy);
        }

        private static string LoginPage(string error, string? returnTo)
            => $"/login?error={error}&returnTo={Uri.EscapeDataString(ReturnUrl.Sanitize(returnTo))}";

        private static string ErrorCode(ExternalLoginResult result) => result switch
        {
            ExternalLoginResult.NoEmail => "external-no-email",
            ExternalLoginResult.EmailInUse => "external-email-in-use",
            ExternalLoginResult.LockedOut => "external-locked-out",
            ExternalLoginResult.SignUpClosed => "external-sign-up-closed",
            _ => ExternalProviders.FailedError
        };

        private static bool IsRegister(HttpRequest request)
            => request.Path.Value?.EndsWith("/register", StringComparison.OrdinalIgnoreCase) == true;
    }
}
