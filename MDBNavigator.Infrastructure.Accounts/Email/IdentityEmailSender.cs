using MDBNavigator.Infrastructure.Accounts.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Logging;
using System.Net;

namespace MDBNavigator.Infrastructure.Accounts.Email
{
    // The emails Identity's endpoints send. Identity builds links to its own API endpoints; users get links to UI pages
    // instead (/confirm-email, /reset-password), which call those endpoints and show the result.
    // A failed send is logged, not thrown: the account change already happened, and the user can ask for the email again.
    internal class IdentityEmailSender : IEmailSender<ApplicationUser>
    {
        private readonly IEmailDelivery _delivery;
        private readonly EmailOptions _options;
        private readonly ILogger<IdentityEmailSender> _logger;

        public IdentityEmailSender(IEmailDelivery delivery, EmailOptions options, ILogger<IdentityEmailSender> logger)
        {
            _delivery = delivery;
            _options = options;
            _logger = logger;
        }

        // confirmationLink: HTML-encoded link to GET /api/auth/confirmEmail?userId=…&code=…[&changedEmail=…].
        public Task SendConfirmationLinkAsync(ApplicationUser user, string email, string confirmationLink)
        {
            var query = QueryHelpers.ParseQuery(new Uri(WebUtility.HtmlDecode(confirmationLink)).Query);
            var parameters = new Dictionary<string, string?>
            {
                ["userId"] = query["userId"].ToString(),
                ["code"] = query["code"].ToString()
            };
            if (query.TryGetValue("changedEmail", out var changedEmail) && !string.IsNullOrEmpty(changedEmail))
            {
                parameters["changedEmail"] = changedEmail.ToString();
            }

            var link = QueryHelpers.AddQueryString(AppUrl("confirm-email"), parameters);
            return SendAsync(EmailTemplates.ConfirmEmail(email, link), "confirmation");
        }

        public Task SendPasswordResetCodeAsync(ApplicationUser user, string email, string resetCode)
        {
            var link = QueryHelpers.AddQueryString(AppUrl("reset-password"),
                new Dictionary<string, string?> { ["email"] = email, ["code"] = resetCode });
            return SendAsync(EmailTemplates.ResetPassword(email, link), "password reset");
        }

        // Not used by Identity's API endpoints (they send a code), but part of the interface.
        public Task SendPasswordResetLinkAsync(ApplicationUser user, string email, string resetLink)
            => SendAsync(EmailTemplates.ResetPassword(email, WebUtility.HtmlDecode(resetLink)), "password reset");

        private string AppUrl(string path) => $"{_options.AppBaseUrl.TrimEnd('/')}/{path}";

        private async Task SendAsync(EmailMessage message, string kind)
        {
            try
            {
                await _delivery.SendAsync(message, CancellationToken.None);
            }
            catch (Exception ex)
            {
                // No recipient in the log: it's personal data.
                _logger.LogError(ex, "Sending the {EmailKind} email failed", kind);
            }
        }
    }
}
