namespace MDBNavigator.Infrastructure.Accounts.Email
{
    public record EmailMessage(string To, string Subject, string HtmlBody, string TextBody);

    // Sends a finished email: over SMTP, or to the log in Development (EmailOptions.Delivery).
    internal interface IEmailDelivery
    {
        Task SendAsync(EmailMessage message, CancellationToken ct);
    }
}
