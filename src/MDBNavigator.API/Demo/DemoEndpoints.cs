using MDBNavigator.Accounts.Demo;
using MDBNavigator.API.Auth;
using MDBNavigator.API.DTOs;
using MDBNavigator.API.RateLimiting;

namespace MDBNavigator.API.Demo
{
    // /api/demo: how invited people get into the public demo (Demo settings). Mapped only with Demo:Enabled.
    // The guest's connection to the sample database is opened by DemoController.
    public static class DemoEndpoints
    {
        public const string InviteInvalidMessage = "This invite link isn't valid. Please ask for a new one.";
        public const string LinkInvalidMessage = "This link has expired or was already used. Please ask for a new one.";

        public static string BlockedMessage(int hours)
            => $"Demo access is paused for {(hours == 1 ? "1 hour" : $"{hours} hours")} after too many refused actions.";

        public static void MapDemoEndpoints(this WebApplication app, DemoOptions options)
        {
            if (!options.Enabled)
            {
                return;
            }

            var demo = app.MapGroup("/api/demo");

            // 204 whether or not an email went out (the address may be over its hourly limit, or its visitor blocked).
            demo.MapPost("join", async (DemoJoinRequest request, HttpContext http, DemoAccess access) =>
                {
                    // The code is checked here, when the form is sent, and nowhere earlier: the start page must not give
                    // anyone a way to test codes without a CAPTCHA.
                    if (options.FindInviteCode(request.InviteCode) is not { } invite)
                    {
                        return AuthEndpoints.Error(StatusCodes.Status403Forbidden, InviteInvalidMessage);
                    }

                    var errors = new Dictionary<string, string[]>();
                    var name = CheckName(request.Name, errors);
                    var email = CheckEmail(request.Email, errors);
                    CheckTerms(request.TermsVersion, errors);
                    if (errors.Count > 0)
                    {
                        return Results.ValidationProblem(errors);
                    }
                    if (await AuthEndpoints.CheckCaptchaAsync(http) is { } captchaFailed)
                    {
                        return captchaFailed;
                    }

                    await access.RequestJoinLinkAsync(name!, email!, invite.Name, http.RequestAborted);
                    return Results.NoContent();
                })
                .RequireRateLimiting(RateLimitPolicies.DemoLink);

            // 204 whether or not the email belongs to a visitor: the answer must not tell who has visited.
            demo.MapPost("sign-in-link", async (DemoSignInLinkRequest request, HttpContext http, DemoAccess access) =>
                {
                    var errors = new Dictionary<string, string[]>();
                    var email = CheckEmail(request.Email, errors);
                    CheckTerms(request.TermsVersion, errors);
                    if (errors.Count > 0)
                    {
                        return Results.ValidationProblem(errors);
                    }
                    if (await AuthEndpoints.CheckCaptchaAsync(http) is { } captchaFailed)
                    {
                        return captchaFailed;
                    }

                    await access.RequestSignInLinkAsync(email!, http.RequestAborted);
                    return Results.NoContent();
                })
                .RequireRateLimiting(RateLimitPolicies.DemoLink);

            // Signs the browser in as a new guest. Per minute per address like sign-in; SessionsPerIpPerHour is counted
            // inside, over the starts that worked.
            demo.MapPost("start", async (DemoStartRequest request, HttpContext http, DemoAccess access) =>
                {
                    if (string.IsNullOrWhiteSpace(request.Token) || request.Token.Length > 100)
                    {
                        return AuthEndpoints.Error(StatusCodes.Status400BadRequest, LinkInvalidMessage);
                    }

                    var address = http.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                    var result = await access.StartAsync(request.Token, address, http.RequestAborted);
                    return result.Outcome switch
                    {
                        DemoStartOutcome.Started => Results.NoContent(),
                        DemoStartOutcome.VisitorDailyLimit => AuthEndpoints.Error(StatusCodes.Status429TooManyRequests,
                            $"You have used today's {options.SessionsPerVisitorPerDay} demo sessions. Please come back tomorrow."),
                        DemoStartOutcome.Full => AuthEndpoints.Error(StatusCodes.Status429TooManyRequests,
                            "The demo is full right now. Please try again in a few minutes."),
                        DemoStartOutcome.AddressLimit => AuthEndpoints.Error(StatusCodes.Status429TooManyRequests,
                            "Too many demo sessions were started from your network in the last hour. Please try again later."),
                        DemoStartOutcome.Blocked => AuthEndpoints.Error(StatusCodes.Status403Forbidden, BlockedMessage(options.BlockHours)),
                        _ => AuthEndpoints.Error(StatusCodes.Status400BadRequest, LinkInvalidMessage)
                    };
                })
                .RequireRateLimiting(RateLimitPolicies.Auth);
        }

        // The keys are error codes, like Identity's validation problems, so the UI can put each message at its field.
        private static string? CheckName(string? value, Dictionary<string, string[]> errors)
        {
            var name = value?.Trim();
            if (string.IsNullOrEmpty(name) || name.Length > DemoVisitor.NameMaxLength || name.Any(char.IsControl))
            {
                errors["InvalidName"] = [$"Please enter your name (at most {DemoVisitor.NameMaxLength} characters)."];
                return null;
            }
            return name;
        }

        private static string? CheckEmail(string? value, Dictionary<string, string[]> errors)
        {
            var email = value?.Trim();
            if (!DemoOptions.IsEmail(email))
            {
                errors["InvalidEmail"] = ["Please enter a valid email address."];
                return null;
            }
            return email;
        }

        // The UI sends the version of the text it showed; an old page (cached, or open since before a change) must be
        // reloaded, so nobody agrees to a text other than the one recorded.
        private static void CheckTerms(string? version, Dictionary<string, string[]> errors)
        {
            if (string.IsNullOrEmpty(version))
            {
                errors["TermsNotAccepted"] = ["Please agree to the demo terms."];
            }
            else if (version != DemoTerms.Version)
            {
                errors["TermsChanged"] = ["The demo terms have changed. Please reload the page."];
            }
        }
    }
}
