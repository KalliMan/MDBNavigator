namespace MDBNavigator.Accounts.Email
{
    public record EmailMessage(string To, string Subject, string HtmlBody, string TextBody);

    // Sends a finished email: over SMTP, or to the log in Development (EmailOptions.Delivery).
    // Public so the API tests can put a fake in its place and read the links in the emails.
    public interface IEmailDelivery
    {
        Task SendAsync(EmailMessage message, CancellationToken ct);
    }
}
