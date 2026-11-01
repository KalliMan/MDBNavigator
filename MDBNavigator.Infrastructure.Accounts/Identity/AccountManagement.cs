using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace MDBNavigator.Infrastructure.Accounts.Identity
{
    public record AccountInfo(string Email, bool HasPassword, IReadOnlyList<string> LinkedProviders);

    // The signed-in user's own account: password, linked providers, deletion. Failures are IdentityResults with an
    // error code, like Identity's own (the UI maps the codes to messages).
    public class AccountManagement
    {
        public const string PasswordMismatch = "PasswordMismatch";
        public const string EmailMismatch = "EmailMismatch";
        public const string LastSignInMethod = "LastSignInMethod";
        public const string LastAdmin = "LastAdmin";
        public const string NotLinked = "NotLinked";
        public const string LinkFailed = "LinkFailed";
        // The session is still valid, but the account was deleted meanwhile.
        public const string AccountNotFound = "AccountNotFound";

        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly UserManager<ApplicationUser> _userManager;

        public AccountManagement(SignInManager<ApplicationUser> signInManager, UserManager<ApplicationUser> userManager)
        {
            _signInManager = signInManager;
            _userManager = userManager;
        }

        public async Task<AccountInfo?> GetAsync(ClaimsPrincipal principal)
        {
            var user = await _userManager.GetUserAsync(principal);
            if (user is null)
            {
                return null;
            }

            var logins = await _userManager.GetLoginsAsync(user);
            return new AccountInfo(user.Email ?? string.Empty, await _userManager.HasPasswordAsync(user),
                logins.Select(l => l.LoginProvider).Order().ToList());
        }

        // Changes the password, or sets a first one for an account created through a provider (no current password).
        public async Task<IdentityResult> SetPasswordAsync(ClaimsPrincipal principal, string? currentPassword, string newPassword)
        {
            if (await _userManager.GetUserAsync(principal) is not { } user)
            {
                return Failed(AccountNotFound);
            }

            var result = await _userManager.HasPasswordAsync(user)
                ? await _userManager.ChangePasswordAsync(user, currentPassword ?? string.Empty, newPassword)
                : await _userManager.AddPasswordAsync(user, newPassword);
            if (result.Succeeded)
            {
                // The change renews the account's security stamp, which ends its other sessions. This one is renewed
                // so the user stays signed in here.
                await _signInManager.RefreshSignInAsync(user);
            }
            return result;
        }

        // The user id travels with the challenge and is checked on the way back, so the provider account can only be
        // linked to the account that started the linking.
        public AuthenticationProperties CreateLinkChallenge(string provider, string callbackUrl, ClaimsPrincipal principal)
            => _signInManager.ConfigureExternalAuthenticationProperties(provider, callbackUrl, _userManager.GetUserId(principal));

        public async Task<(IdentityResult Result, string? Provider)> CompleteLinkAsync(ClaimsPrincipal principal)
        {
            if (await _userManager.GetUserAsync(principal) is not { } user)
            {
                return (Failed(LinkFailed), null);
            }

            try
            {
                var info = await _signInManager.GetExternalLoginInfoAsync(user.Id.ToString());
                if (info is null)
                {
                    return (Failed(LinkFailed), null);
                }

                // Linking while signed in needs no email match: the user proves both accounts by signing in to each.
                // Fails with LoginAlreadyAssociated when another account already uses this provider account.
                var result = await _userManager.AddLoginAsync(user, info);
                if (result.Succeeded)
                {
                    await _signInManager.RefreshSignInAsync(user);
                }
                return (result, info.LoginProvider);
            }
            finally
            {
                await _signInManager.Context.SignOutAsync(IdentityConstants.ExternalScheme);
            }
        }

        public async Task<IdentityResult> UnlinkAsync(ClaimsPrincipal principal, string provider)
        {
            if (await _userManager.GetUserAsync(principal) is not { } user)
            {
                return Failed(AccountNotFound);
            }

            var logins = await _userManager.GetLoginsAsync(user);
            var login = logins.FirstOrDefault(l => string.Equals(l.LoginProvider, provider, StringComparison.OrdinalIgnoreCase));
            if (login is null)
            {
                return Failed(NotLinked);
            }
            // Without a password, the last provider is the only way back in.
            if (!await _userManager.HasPasswordAsync(user) && logins.Count == 1)
            {
                return Failed(LastSignInMethod);
            }

            var result = await _userManager.RemoveLoginAsync(user, login.LoginProvider, login.ProviderKey);
            if (result.Succeeded)
            {
                await _signInManager.RefreshSignInAsync(user);
            }
            return result;
        }

        // Proof that the owner is at the keyboard: the password, or (account without one) the email typed in.
        public async Task<IdentityResult> DeleteAsync(ClaimsPrincipal principal, string? password, string? email)
        {
            if (await _userManager.GetUserAsync(principal) is not { } user)
            {
                return Failed(AccountNotFound);
            }

            if (await _userManager.HasPasswordAsync(user))
            {
                if (!await _userManager.CheckPasswordAsync(user, password ?? string.Empty))
                {
                    return Failed(PasswordMismatch);
                }
            }
            else if (!string.Equals(email?.Trim(), user.Email, StringComparison.OrdinalIgnoreCase))
            {
                return Failed(EmailMismatch);
            }

            // Someone must be able to manage the server.
            if (await _userManager.IsInRoleAsync(user, RoleNames.Admin)
                && (await _userManager.GetUsersInRoleAsync(RoleNames.Admin)).Count == 1)
            {
                return Failed(LastAdmin);
            }

            var result = await _userManager.DeleteAsync(user);
            if (result.Succeeded)
            {
                await _signInManager.SignOutAsync();
            }
            return result;
        }

        private static IdentityResult Failed(string code) => IdentityResult.Failed(new IdentityError { Code = code, Description = code });
    }
}
