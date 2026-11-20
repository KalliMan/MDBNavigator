using MDBNavigator.API.Captcha;
using MDBNavigator.API.Core;
using MDBNavigator.API.DTOs;
using MDBNavigator.API.RateLimiting;
using MDBNavigator.Connections.Application.SavedConnections;
using MDBNavigator.Accounts;
using MDBNavigator.Accounts.Demo;
using MDBNavigator.Accounts.Email;
using MDBNavigator.Accounts.Identity;
using MDBNavigator.SharedKernel.Captcha;
using MDBNavigator.SharedKernel.Violations;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace MDBNavigator.API.Auth
{
    // /api/auth. Minimal APIs rather than a controller, because Identity's own endpoints (login, register, password
    // reset, ...) are minimal APIs, and which endpoints exist depends on Auth:Mode.
    public static class AuthEndpoints
    {
        public const string GuestRefusedMessage = "Demo sessions have no account settings.";

        public static void MapAuthEndpoints(this WebApplication app, AuthOptions options, CaptchaOptions captchaOptions, DemoOptions demo)
        {
            var auth = app.MapGroup("/api/auth");
            // The site key is public (the widget needs it); the secret key never leaves the server.
            var captchaProvider = captchaOptions.Provider.ToString();
            var turnstileSiteKey = captchaOptions.Provider == CaptchaProvider.Turnstile ? captchaOptions.Turnstile.SiteKey : null;

            if (options.Mode != AuthMode.Accounts)
            {
                // No accounts, but the CAPTCHA still applies to repeated failed connects.
                auth.MapGet("settings", (ISavedPasswordProtector passwords) => new AuthSettingsDto(options.Mode.ToString(), options.SignUp.ToString(), [],
                    EmailEnabled: false, captchaProvider, turnstileSiteKey, passwords.Enabled, Demo: null));
                return;
            }

            // Only what the UI shows: the guest's connection is opened by the server (DemoController).
            var demoSettings = demo.Enabled
                ? new DemoSettingsDto(demo.ContactEmail, demo.SessionMinutes, demo.Connection.Name, demo.ViolationsBeforeBlock, demo.BlockHours)
                : null;
            auth.MapGet("settings", async (ExternalLogins logins, EmailOptions email, ISavedPasswordProtector passwords) =>
                new AuthSettingsDto(options.Mode.ToString(), options.SignUp.ToString(), await logins.GetProvidersAsync(), email.Enabled,
                    captchaProvider, turnstileSiteKey, passwords.Enabled, demoSettings));

            // Identity's endpoints: login (?useCookies=true for the web session), register, confirmEmail,
            // resendConfirmationEmail, forgotPassword, resetPassword, manage/info, ...
            app.MapGroup("/api/auth")
                .RequireRateLimiting(RateLimitPolicies.Auth)
                .AddEndpointFilter(async (context, next) =>
                    IsRegister(context.HttpContext.Request)
                        ? await CheckRegisterAsync(context.HttpContext, options) ?? await next(context)
                        // A guest could otherwise give its account a real email (manage/info) and keep it.
                        : IsManage(context.HttpContext.Request) && GuestSessions.IsGuest(context.HttpContext.User)
                            ? await RefuseGuestAsync(context.HttpContext)
                            : await next(context))
                .MapIdentityApi<ApplicationUser>();

            auth.MapGet("me", async (ClaimsPrincipal principal, UserManager<ApplicationUser> users, GuestSessions guests, TimeProvider time,
                    CancellationToken ct) =>
                {
                    // The cookie is valid but the account is gone.
                    if (await users.GetUserAsync(principal) is not { } user)
                    {
                        return Results.Unauthorized();
                    }

                    GuestDto? guest = null;
                    if (GuestSessions.IsGuest(principal))
                    {
                        if (await guests.GetAsync(principal, ct) is not { } info)
                        {
                            return Results.Unauthorized();
                        }
                        var secondsLeft = (int)Math.Ceiling((info.EndsAtUtc - time.GetUtcNow().UtcDateTime).TotalSeconds);
                        guest = new GuestDto(info.Name, info.EndsAtUtc, Math.Max(0, secondsLeft));
                    }

                    return Results.Ok(new CurrentUserDto(user.Email ?? string.Empty, await users.IsInRoleAsync(user, RoleNames.Admin),
                        SignInMethod(principal), guest));
                })
                .RequireAuthorization();

            // Allowed without a valid session, so a stale cookie can always be cleared. A demo guest's session ends here
            // for good: its place frees up and its account is deleted at once.
            auth.MapPost("logout", async (ClaimsPrincipal principal, SignInManager<ApplicationUser> signInManager, GuestSessions guests) =>
            {
                if (GuestSessions.IsGuest(principal))
                {
                    await guests.EndAsync(principal, CancellationToken.None);
                }
                await signInManager.SignOutAsync();
                return Results.NoContent();
            });

            MapExternalSignIn(auth, options);
            MapAccount(auth);
        }

        // The UI never sends a guest to these endpoints, so a call is someone probing: it counts as a refused action.
        private static async Task<IResult> RefuseGuestAsync(HttpContext http)
        {
            if (http.RequestServices.GetService<IViolationRecorder>() is { } violations
                && http.User.FindFirstValue(ClaimTypes.NameIdentifier) is { } userId)
            {
                await violations.RecordAsync(userId, ViolationKind.PermissionDenied);
            }
            return Error(StatusCodes.Status403Forbidden, GuestRefusedMessage);
        }

        // The signed-in user's own account (the UI's /account page).
        private static void MapAccount(RouteGroupBuilder auth)
        {
            // A demo guest's account is thrown away at the end of the session: nothing to manage.
            var account = auth.MapGroup("account")
                .RequireAuthorization()
                .AddEndpointFilter(async (context, next) => GuestSessions.IsGuest(context.HttpContext.User)
                    ? await RefuseGuestAsync(context.HttpContext)
                    : await next(context));

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

            account.MapPost("delete", async (DeleteAccountRequest request, ClaimsPrincipal principal, AccountManagement accounts) =>
                    ToResult(await accounts.DeleteAsync(principal, request.Password, request.Email)))
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

        // Identity's register endpoint can't be changed, so these checks run in front of it: null lets it run.
        // The CAPTCHA is checked before Identity looks at the body, so a token is used up even when the email turns out
        // to be taken; the UI asks for a new one after every attempt. Social sign-in asks for no CAPTCHA: the
        // provider has already checked the person.
        private static async Task<IResult?> CheckRegisterAsync(HttpContext http, AuthOptions options)
        {
            if (options.SignUp == SignUpMode.Closed)
            {
                return Error(StatusCodes.Status403Forbidden, "Creating accounts is switched off on this server.");
            }

            return await CheckCaptchaAsync(http);
        }

        // Null when no CAPTCHA is configured or the Captcha-Token header holds a valid, unused token; otherwise 428.
        // Also used by the demo's link requests.
        internal static async Task<IResult?> CheckCaptchaAsync(HttpContext http)
        {
            var captcha = http.RequestServices.GetRequiredService<ICaptchaVerifier>();
            if (!captcha.Enabled)
            {
                return null;
            }

            string? token = http.Request.Headers[CaptchaEndpoints.TokenHeader];
            if (string.IsNullOrEmpty(token))
            {
                return Error(StatusCodes.Status428PreconditionRequired, "Please complete the CAPTCHA.");
            }
            return await captcha.VerifyAsync(token, http.RequestAborted)
                ? null
                : Error(StatusCodes.Status428PreconditionRequired, "The CAPTCHA check didn't pass. Please try it again.");
        }

        internal static IResult Error(int statusCode, string message)
            => Results.Json(new ErrorResponse(statusCode, message), statusCode: statusCode);

        private static bool IsRegister(HttpRequest request)
            => request.Path.Value?.EndsWith("/register", StringComparison.OrdinalIgnoreCase) == true;

        // Identity's manage/info and manage/2fa.
        private static bool IsManage(HttpRequest request)
            => request.Path.Value?.Contains("/manage/", StringComparison.OrdinalIgnoreCase) == true;
    }
}
