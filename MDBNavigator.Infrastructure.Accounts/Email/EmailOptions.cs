namespace MDBNavigator.Infrastructure.Accounts.Email
{
    public enum EmailDelivery
    {
        // No email: accounts work without confirmation, and an admin resets passwords.
        None,
        Smtp,
        // Development only: emails (with their links) are written to the log instead of being sent.
        Log
    }

    // The "Email" section. With Smtp or Log, a new account must confirm its email before signing in with a password,
    // and "forgot password" works.
    public class EmailOptions
    {
        public const string SectionName = "Email";

        public EmailDelivery Delivery { get; set; } = EmailDelivery.None;

        // Where links in emails point, e.g. "https://mdbnavigator.example.com" (development: http://localhost:3000).
        // Configured rather than taken from the request: a forged Host header must not turn a reset link into a link
        // to someone else's site.
        public string AppBaseUrl { get; set; } = string.Empty;

        public string FromAddress { get; set; } = string.Empty;
        public string FromName { get; set; } = "MDBNavigator";

        public SmtpOptions Smtp { get; set; } = new();

        public bool Enabled => Delivery != EmailDelivery.None;
    }

    public class SmtpOptions
    {
        public string Host { get; set; } = string.Empty;

        // 587: STARTTLS. 465: TLS from the start.
        public int Port { get; set; } = 587;

        public string Username { get; set; } = string.Empty;

        // A secret: user secrets locally, an environment variable (Email__Smtp__Password) in production.
        public string Password { get; set; } = string.Empty;
    }
}
