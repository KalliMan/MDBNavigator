using System.Text.Encodings.Web;

namespace MDBNavigator.Infrastructure.Accounts.Email
{
    // The texts of the account emails, as HTML and plain text.
    internal static class EmailTemplates
    {
        public static EmailMessage ConfirmEmail(string to, string link) => Build(
            to,
            subject: "Confirm your email for MDBNavigator",
            intro: "Please confirm your email address to finish creating your MDBNavigator account.",
            buttonText: "Confirm email",
            link,
            outro: "If you didn't create an MDBNavigator account, you can ignore this email.");

        public static EmailMessage ResetPassword(string to, string link) => Build(
            to,
            subject: "Reset your MDBNavigator password",
            intro: "Someone asked to reset the password of your MDBNavigator account. Choose a new password with the link below.",
            buttonText: "Choose a new password",
            link,
            outro: "If you didn't ask for this, you can ignore this email; your password stays the same.");

        private static EmailMessage Build(string to, string subject, string intro, string buttonText, string link, string outro)
        {
            var html = HtmlEncoder.Default;
            var htmlBody = $"""
                <div style="font-family:sans-serif;max-width:480px;line-height:1.5">
                  <p>Hi,</p>
                  <p>{html.Encode(intro)}</p>
                  <p><a href="{html.Encode(link)}" style="display:inline-block;padding:10px 18px;background:#7e22ce;color:#fff;border-radius:6px;text-decoration:none">{html.Encode(buttonText)}</a></p>
                  <p style="font-size:13px;color:#666">{html.Encode(outro)}</p>
                </div>
                """;
            var textBody = $"Hi,\n\n{intro}\n\n{buttonText}: {link}\n\n{outro}\n";

            return new EmailMessage(to, subject, htmlBody, textBody);
        }
    }
}
