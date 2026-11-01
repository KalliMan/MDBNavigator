namespace MDBNavigator.Application.Common
{
    public enum CaptchaProvider
    {
        None,
        // Cloudflare's hosted CAPTCHA: needs a Cloudflare account (free) and sends the visitor to Cloudflare.
        Turnstile,
        // Self-hosted proof of work: the browser spends a second or two of computing, nothing leaves the server.
        Altcha
    }

    // Asked when creating an account, and on connect once RateLimiting:FailedConnectsBeforeWait failures were reached
    // (instead of the wait). Off by default.
    public class CaptchaOptions
    {
        public const string SectionName = "Captcha";

        public CaptchaProvider Provider { get; set; } = CaptchaProvider.None;

        public TurnstileOptions Turnstile { get; set; } = new();
    }

    public class TurnstileOptions
    {
        // Public: the UI renders the widget with it.
        public string? SiteKey { get; set; }

        // A secret: user secrets or an environment variable, never appsettings.json.
        public string? SecretKey { get; set; }
    }
}
