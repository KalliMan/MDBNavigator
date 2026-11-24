using Gatehouse.Accounts;

namespace MDBNavigator.Accounts.Identity
{
    // MDBNavigator's part of provider sign-in. The rules (find, link or create the account) are Gatehouse.Accounts'.
    internal sealed class AppExternalAccountHooks : ExternalAccountHooks<ApplicationUser>
    {
        private readonly AuthOptions _options;

        public AppExternalAccountHooks(AuthOptions options)
        {
            _options = options;
        }

        // The package saves the user and confirms the email, only when the provider verified it.
        public override ApplicationUser CreateUser(ExternalAccount account)
            => new() { UserName = account.Email, Email = account.Email };

        // Closed sign-up: existing accounts can still sign in through a provider, new ones aren't created.
        public override ValueTask<bool> AllowNewAccountAsync(ExternalAccount account, CancellationToken ct)
            => ValueTask.FromResult(_options.SignUp == SignUpMode.Open);
    }
}
