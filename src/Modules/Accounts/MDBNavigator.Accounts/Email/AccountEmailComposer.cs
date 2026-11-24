using Gatehouse.Accounts;
using MDBNavigator.Accounts.Identity;

namespace MDBNavigator.Accounts.Email
{
    // Writes the account emails Gatehouse.Accounts sends. The package decides which email is needed and builds its link
    // to the UI page (/confirm-email, /reset-password under Email:FrontendBaseUrl); the texts and the design are ours.
    internal sealed class AccountEmailComposer : IAccountEmailComposer<ApplicationUser>
    {
        public Task<EmailMessage?> ComposeAsync(ApplicationUser user, AccountEmail email, CancellationToken ct)
            => Task.FromResult<EmailMessage?>(email.Kind switch
            {
                // A changed email (Identity's manage/info; the UI has no form for it) gets the same text as a new account's.
                AccountEmailKind.ConfirmEmail or AccountEmailKind.ConfirmEmailChange => EmailTemplates.ConfirmEmail(email.To, email.Link),
                AccountEmailKind.ResetPassword => EmailTemplates.ResetPassword(email.To, email.Link),
                // The package's sender catches it and logs the kind: better than the wrong text for a kind added later.
                _ => throw new ArgumentOutOfRangeException(nameof(email), email.Kind, "Unknown account email kind.")
            });
    }
}
