using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace MDBNavigator.Infrastructure.Accounts.Email
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
            mime.From.Add(new MailboxAddress(_options.FromName, _options.FromAddress));
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
