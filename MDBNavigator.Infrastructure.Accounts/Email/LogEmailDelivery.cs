using Microsoft.Extensions.Logging;

namespace MDBNavigator.Infrastructure.Accounts.Email
{
    // Development only: writes the email, including recipient and link, to the log instead of sending it.
    // Startup fails if this is configured outside Development.
    internal class LogEmailDelivery : IEmailDelivery
    {
        private readonly ILogger<LogEmailDelivery> _logger;

        public LogEmailDelivery(ILogger<LogEmailDelivery> logger)
        {
            _logger = logger;
        }

        public Task SendAsync(EmailMessage message, CancellationToken ct)
        {
            _logger.LogInformation("Email (not sent, Development) to {To}: {Subject}\n{Body}", message.To, message.Subject, message.TextBody);
            return Task.CompletedTask;
        }
    }
}
