using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace MDBNavigator.Infrastructure.Accounts.Identity
{
    // Outcome of a sign-in through Google/Microsoft/GitHub; anything but Success becomes a message on the sign-in page.
    public enum ExternalLoginResult
    {
        Success,
        NoEmail,
        EmailInUse,
        LockedOut,
        // No account for this email, and Auth:SignUp is Closed.
        SignUpClosed,
        Failed
    }

    // Sign-in through an external provider: start the redirect, and on the way back find, link or create the account
    // and sign in with the normal session cookie.
    public class ExternalLogins
    {
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<ExternalLogins> _logger;

        public ExternalLogins(SignInManager<ApplicationUser> signInManager, UserManager<ApplicationUser> userManager, ILogger<ExternalLogins> logger)
        {
            _signInManager = signInManager;
            _userManager = userManager;
            _logger = logger;
        }

        // The configured providers, e.g. ["GitHub", "Google"].
        public async Task<IReadOnlyList<string>> GetProvidersAsync()
            => (await _signInManager.GetExternalAuthenticationSchemesAsync()).Select(s => s.Name).Order().ToList();

        // The scheme for a name like "google", or null when that provider isn't configured.
        public async Task<string?> FindProviderAsync(string name)
            => (await GetProvidersAsync()).FirstOrDefault(p => string.Equals(p, name, StringComparison.OrdinalIgnoreCase));

        public AuthenticationProperties CreateChallenge(string provider, string callbackUrl)
            => _signInManager.ConfigureExternalAuthenticationProperties(provider, callbackUrl);

        // Called when the provider has sent the user back. Signs in on success. allowNewAccounts: false when sign-up
        // is closed; then only accounts that already exist can sign in.
        public async Task<ExternalLoginResult> CompleteAsync(bool allowNewAccounts)
        {
            var info = await _signInManager.GetExternalLoginInfoAsync();
            if (info is null)
            {
                return ExternalLoginResult.Failed;
            }

            try
            {
                return await SignInAsync(info, allowNewAccounts);
            }
            finally
            {
                // The short-lived cookie that carried the provider's answer is no longer needed.
                await _signInManager.Context.SignOutAsync(IdentityConstants.ExternalScheme);
            }
        }

        private async Task<ExternalLoginResult> SignInAsync(ExternalLoginInfo info, bool allowNewAccounts)
        {
            // Already linked: the usual case after the first time.
            var existing = await _signInManager.ExternalLoginSignInAsync(info.LoginProvider, info.ProviderKey, isPersistent: true, bypassTwoFactor: true);
            if (existing.Succeeded)
            {
                return ExternalLoginResult.Success;
            }
            if (existing.IsLockedOut)
            {
                return ExternalLoginResult.LockedOut;
            }
            if (existing.IsNotAllowed)
            {
                // Identity refuses because the email isn't confirmed (required once email is switched on). That rule
                // is for passwords; here the provider vouches for the person, so a linked account may sign in.
                var linked = await _userManager.FindByLoginAsync(info.LoginProvider, info.ProviderKey);
                if (linked is null)
                {
                    return ExternalLoginResult.Failed;
                }
                if (await _userManager.IsLockedOutAsync(linked))
                {
                    return ExternalLoginResult.LockedOut;
                }

                await _signInManager.SignInAsync(linked, isPersistent: true, info.LoginProvider);
                return ExternalLoginResult.Success;
            }

            var email = info.Principal.FindFirstValue(ClaimTypes.Email);
            if (string.IsNullOrWhiteSpace(email))
            {
                return ExternalLoginResult.NoEmail;
            }

            var emailVerified = ExternalProviders.IsEmailVerified(info);
            var user = await _userManager.FindByEmailAsync(email);
            if (user is not null)
            {
                // Linking gives whoever controls the provider account access to this account. That is safe only when
                // both sides proved the address: the provider verified it AND the account confirmed it. Otherwise
                // someone could register the address first (with a password, or through a provider that doesn't
                // verify emails) and end up sharing the real owner's account. The owner can still sign in with the
                // password and link the provider from the account page.
                if (!emailVerified || !user.EmailConfirmed)
                {
                    return ExternalLoginResult.EmailInUse;
                }
            }
            else if (!allowNewAccounts)
            {
                return ExternalLoginResult.SignUpClosed;
            }
            else
            {
                user = new ApplicationUser { UserName = email, Email = email, EmailConfirmed = emailVerified };
                if (!await SucceededAsync(_userManager.CreateAsync(user), "create"))
                {
                    return ExternalLoginResult.Failed;
                }
            }

            if (!await SucceededAsync(_userManager.AddLoginAsync(user, info), "link"))
            {
                return ExternalLoginResult.Failed;
            }

            await _signInManager.SignInAsync(user, isPersistent: true, info.LoginProvider);
            return ExternalLoginResult.Success;
        }

        private async Task<bool> SucceededAsync(Task<IdentityResult> operation, string action)
        {
            var result = await operation;
            if (!result.Succeeded)
            {
                // Error codes only: Identity's descriptions can contain the email.
                _logger.LogWarning("External sign-in: could not {Action} the account ({ErrorCodes})",
                    action, string.Join(", ", result.Errors.Select(e => e.Code)));
            }
            return result.Succeeded;
        }
    }
}
