using MDBNavigator.API.Core;
using MDBNavigator.API.DTOs;
using MDBNavigator.API.RateLimiting;
using MDBNavigator.Application.Contracts;
using MDBNavigator.Infrastructure.Accounts;
using MDBNavigator.Infrastructure.Accounts.Email;
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
                auth.MapGet("settings", () => new AuthSettingsDto(options.Mode.ToString(), options.SignUp.ToString(), [], EmailEnabled: false));
                return;
            }

            auth.MapGet("settings", async (ExternalLogins logins, EmailOptions email) =>
                new AuthSettingsDto(options.Mode.ToString(), options.SignUp.ToString(), await logins.GetProvidersAsync(), email.Enabled));

            // Identity's endpoints: login (?useCookies=true for the web session), register, confirmEmail,
            // resendConfirmationEmail, forgotPassword, resetPassword, manage/info, ...
            app.MapGroup("/api/auth")
                .RequireRateLimiting(RateLimitPolicies.Auth)
                .AddEndpointFilter(async (context, next) =>
                    options.SignUp == SignUpMode.Closed && IsRegister(context.HttpContext.Request)
                        ? Results.Json(
                            new ErrorResponse(StatusCodes.Status403Forbidden, "Creating accounts is switched off on this server."),
                            statusCode: StatusCodes.Status403Forbidden)
                        : await next(context))
                .MapIdentityApi<ApplicationUser>();

            auth.MapGet("me", async (ClaimsPrincipal principal, UserManager<ApplicationUser> users) =>
                    await users.GetUserAsync(principal) is { } user
                        ? Results.Ok(new CurrentUserDto(user.Email ?? string.Empty, await users.IsInRoleAsync(user, RoleNames.Admin), SignInMethod(principal)))
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
            MapAccount(auth);
        }

        // The signed-in user's own account (the UI's /account page).
        private static void MapAccount(RouteGroupBuilder auth)
        {
            var account = auth.MapGroup("account").RequireAuthorization();

            account.MapGet("", async (ClaimsPrincipal principal, AccountManagement accounts) =>
                await accounts.GetAsync(principal) is { } info ? Results.Ok(info) : Results.Unauthorized());

            account.MapPost("password", async (SetPasswordRequest request, ClaimsPrincipal principal, AccountManagement accounts) =>
                    ToResult(await accounts.SetPasswordAsync(principal, request.CurrentPassword, request.NewPassword)))
                .RequireRateLimiting(RateLimitPolicies.Auth);

            // Linking is a browser navigation like provider sign-in, but back to the account page.
            account.MapGet("link/{provider}", async (string provider, ClaimsPrincipal principal, ExternalLogins logins, AccountManagement accounts) =>
                    await logins.FindProviderAsync(provider) is { } scheme
                        ? Results.Challenge(accounts.CreateLinkChallenge(scheme, "/api/auth/account/link/callback", principal), [scheme])
                        : Results.Redirect("/account?error=link-failed"))
                .RequireRateLimiting(RateLimitPolicies.Auth);

            account.MapGet("link/callback", async (ClaimsPrincipal principal, AccountManagement accounts) =>
                {
                    var (result, provider) = await accounts.CompleteLinkAsync(principal);
                    return Results.Redirect(result.Succeeded
                        ? $"/account?linked={Uri.EscapeDataString(provider ?? string.Empty)}"
                        : result.Errors.Any(e => e.Code == nameof(IdentityErrorDescriber.LoginAlreadyAssociated))
                            ? "/account?error=link-in-use"
                            : "/account?error=link-failed");
                })
                .RequireRateLimiting(RateLimitPolicies.Auth);

            account.MapDelete("logins/{provider}", async (string provider, ClaimsPrincipal principal, AccountManagement accounts) =>
                ToResult(await accounts.UnlinkAsync(principal, provider)));

            account.MapPost("delete", async (DeleteAccountRequest request, ClaimsPrincipal principal, AccountManagement accounts,
                    IConnectionCache connections, ICommandExecutionRegistry executions, ILogger<AccountManagement> logger) =>
                {
                    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
                    var result = await accounts.DeleteAsync(principal, request.Password, request.Email);
                    if (result.Succeeded && userId is not null)
                    {
                        // Nothing of the account may outlive it: its cached database credentials and running queries.
                        var cancelled = executions.CancelAllForUser(userId);
                        var removed = connections.RemoveAllForUser(userId);
                        logger.LogInformation("Account deleted; {Removed} cached connections removed, {Cancelled} running queries cancelled",
                            removed, cancelled);
                    }
                    return ToResult(result);
                })
                .RequireRateLimiting(RateLimitPolicies.Auth);
        }

        // Errors in the shape of Identity's own endpoints: a validation problem keyed by error code.
        private static IResult ToResult(IdentityResult result)
            => result.Succeeded
                ? Results.NoContent()
                : Results.ValidationProblem(result.Errors
                    .GroupBy(e => e.Code)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.Description).ToArray()));

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
                .RequireRateLimiting(RateLimitPolicies.Auth);

            auth.MapGet("external/callback", async (string? returnTo, ExternalLogins logins) =>
                {
                    // Closed sign-up: existing accounts can still sign in through a provider, new ones aren't created.
                    var result = await logins.CompleteAsync(allowNewAccounts: options.SignUp == SignUpMode.Open);
                    return Results.Redirect(result == ExternalLoginResult.Success
                        ? ReturnUrl.Sanitize(returnTo)
                        : LoginPage(ErrorCode(result), returnTo));
                })
                .RequireRateLimiting(RateLimitPolicies.Auth);
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

        // Identity records it in the session: the provider's name for a provider sign-in, "amr" = "pwd" for a password.
        private static string? SignInMethod(ClaimsPrincipal principal)
            => principal.FindFirstValue(ClaimTypes.AuthenticationMethod)
                ?? (principal.HasClaim("amr", "pwd") ? "Password" : null);

        private static bool IsRegister(HttpRequest request)
            => request.Path.Value?.EndsWith("/register", StringComparison.OrdinalIgnoreCase) == true;
    }
}
