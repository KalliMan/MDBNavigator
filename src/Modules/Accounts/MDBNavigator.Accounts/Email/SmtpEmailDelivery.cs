using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using MimeKit.Utils;

namespace MDBNavigator.Accounts.Email
{
    internal class SmtpEmailDelivery : IEmailDelivery
    {
        private readonly EmailOptions _options;

        public SmtpEmailDelivery(EmailOptions options)
        {
            _options = options;
        }

        public async Task SendAsync(EmailMessage message, CancellationToken ct)
        {
            using var mime = new MimeMessage();
            var from = new MailboxAddress(_options.FromName, _options.FromAddress);
            mime.From.Add(from);
            // MimeKit's default Message-ID ends in this machine's host name, which in Docker is the container's id
            // (e.g. "@2b9359c114d8"). Spam filters score a Message-ID without a real domain against the email, so it
            // gets the sender's domain instead.
            mime.MessageId = MimeUtils.GenerateMessageId(from.Domain);
            mime.To.Add(MailboxAddress.Parse(message.To));
            mime.Subject = message.Subject;
            mime.Body = new BodyBuilder { HtmlBody = message.HtmlBody, TextBody = message.TextBody }.ToMessageBody();

            using var client = new SmtpClient();
            var security = _options.Smtp.Port == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls;
            await client.ConnectAsync(_options.Smtp.Host, _options.Smtp.Port, security, ct);
            if (_options.Smtp.Username.Length > 0)
            {
                await client.AuthenticateAsync(_options.Smtp.Username, _options.Smtp.Password, ct);
            }

            await client.SendAsync(mime, ct);
            await client.DisconnectAsync(quit: true, ct);
        }
    }
}
