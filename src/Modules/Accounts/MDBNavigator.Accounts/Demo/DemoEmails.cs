using MDBNavigator.Accounts.Email;
using Microsoft.Extensions.Logging;

namespace MDBNavigator.Accounts.Demo
{
    internal static class DemoEmails
    {
        // Sent after the answer, so a request that sends an email takes as long as one that doesn't (an unknown returning
        // visitor, an address over its limit, a blocked visitor): the timing must not tell who has visited. A failure is
        // logged, without the recipient; the visitor can ask again.
        public static void SendInBackground(IEmailDelivery delivery, EmailMessage message, string kind, ILogger logger)
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    await delivery.SendAsync(message, CancellationToken.None);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Sending the {EmailKind} email failed", kind);
                }
            });
        }
    }
}
