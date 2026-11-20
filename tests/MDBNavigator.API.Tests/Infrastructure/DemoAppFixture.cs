using MDBNavigator.Accounts.Email;
using Microsoft.Extensions.DependencyInjection;
using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Json;
using System.Text.RegularExpressions;

namespace MDBNavigator.API.Tests.Infrastructure
{
    [CollectionDefinition(Name)]
    public sealed class DemoCollection : ICollectionFixture<DemoAppFixture>
    {
        public const string Name = "API with the demo on";
    }

    // An app with the public demo on: invite links, emailed sign-in links and guest sessions. Emails are caught instead
    // of sent, and the clock can be moved forward to end sessions. A collection of its own: it needs email, which changes
    // what the smoke tests see (confirmed emails), and its clock moves.
    public sealed partial class DemoAppFixture : AppFixture
    {
        public const string InviteCode = "smoke-invite-code-0123456789";
        public const string OwnerEmail = "owner@example.test";
        public const string ContactEmail = "support@example.test";
        public const string ConnectionName = "Smoke sample";
        public const string TermsVersion = "2026-11-20";
        public const int SessionMinutes = 10;
        public const int SessionsPerVisitorPerDay = 2;
        public const int LinkEmailsPerAddressPerHour = 3;

        public CapturedEmails Emails { get; } = new();
        public TestClock Clock { get; } = new();

        protected override IReadOnlyDictionary<string, string> AppSettings() => new Dictionary<string, string>
        {
            // The demo needs email; nothing is sent (CapturedEmails replaces the SMTP delivery).
            ["Email:Delivery"] = "Smtp",
            ["Email:Smtp:Host"] = "smtp.invalid",
            ["Email:FromAddress"] = "demo-sender@example.test",
            ["Email:AppBaseUrl"] = "https://demo.example.test",
            ["Demo:Enabled"] = "true",
            ["Demo:InviteCode"] = InviteCode,
            ["Demo:OwnerEmail"] = OwnerEmail,
            ["Demo:ContactEmail"] = ContactEmail,
            ["Demo:SessionMinutes"] = SessionMinutes.ToString(),
            ["Demo:SessionsPerVisitorPerDay"] = SessionsPerVisitorPerDay.ToString(),
            ["Demo:LinkEmailsPerAddressPerHour"] = LinkEmailsPerAddressPerHour.ToString(),
            // Every test comes from one address.
            ["Demo:MaxActiveGuests"] = "1000",
            ["Demo:SessionsPerIpPerHour"] = "1000",
            ["Demo:LinkRequestsPerIpPerHour"] = "10000",
            ["Demo:Connection:Name"] = ConnectionName,
            ["Demo:Connection:ServerName"] = PgHost,
            ["Demo:Connection:Port"] = PgPort.ToString(),
            ["Demo:Connection:UserName"] = PgUser,
            ["Demo:Connection:Password"] = PgPassword,
            ["Demo:Connection:DatabaseName"] = Database,
        };

        protected override void ConfigureServices(IServiceCollection services)
        {
            services.AddSingleton<IEmailDelivery>(Emails);
            services.AddSingleton<TimeProvider>(Clock);
        }

        public static string NewEmail() => $"visitor-{Guid.NewGuid():N}@example.test";

        public async Task<HttpResponseMessage> JoinAsync(string name, string email, string? inviteCode = InviteCode, string? termsVersion = TermsVersion)
        {
            using var client = CreateAnonymousClient();
            return await client.PostAsJsonAsync("/api/demo/join", new { inviteCode, name, email, termsVersion });
        }

        public async Task<HttpResponseMessage> AskForSignInLinkAsync(string email)
        {
            using var client = CreateAnonymousClient();
            return await client.PostAsJsonAsync("/api/demo/sign-in-link", new { email, termsVersion = TermsVersion });
        }

        public async Task<HttpResponseMessage> PostStartAsync(string token)
        {
            using var client = CreateAnonymousClient();
            return await client.PostAsJsonAsync("/api/demo/start", new { token });
        }

        // The token of the count-th demo link sent to this address (1 = the first).
        public async Task<string> LinkTokenAsync(string email, int count = 1)
        {
            var message = await Emails.WaitForAsync(email, count);
            var match = TokenPattern().Match(message.TextBody);
            Assert.True(match.Success, $"No demo link in the email: {message.TextBody}");
            return match.Groups[1].Value;
        }

        public async Task<ApiSession> StartAsync(string token)
        {
            var response = await PostStartAsync(token).ShouldBeAsync(HttpStatusCode.NoContent);
            var cookie = string.Join("; ", response.Headers.GetValues("Set-Cookie").Select(value => value.Split(';')[0]));
            return new ApiSession(this, cookie, Guid.NewGuid().ToString());
        }

        // From the invite form to a signed-in guest.
        public async Task<ApiSession> NewGuestAsync(string name = "Smoke Visitor")
        {
            var email = NewEmail();
            await JoinAsync(name, email).ShouldBeAsync(HttpStatusCode.NoContent);
            return await StartAsync(await LinkTokenAsync(email));
        }

        [GeneratedRegex(@"/demo/start\?token=([A-Za-z0-9_-]+)")]
        private static partial Regex TokenPattern();
    }

    // Takes the place of SMTP: keeps every email. Demo emails go out after the answer, so the tests wait for them.
    public sealed class CapturedEmails : IEmailDelivery
    {
        private static readonly TimeSpan Timeout = TimeSpan.FromSeconds(10);

        private readonly ConcurrentQueue<EmailMessage> _sent = new();

        public Task SendAsync(EmailMessage message, CancellationToken ct)
        {
            _sent.Enqueue(message);
            return Task.CompletedTask;
        }

        public IReadOnlyList<EmailMessage> To(string address)
            => _sent.Where(m => string.Equals(m.To, address, StringComparison.OrdinalIgnoreCase)).ToList();

        public async Task<EmailMessage> WaitForAsync(string address, int count = 1)
        {
            var deadline = DateTime.UtcNow + Timeout;
            while (DateTime.UtcNow < deadline)
            {
                var emails = To(address);
                if (emails.Count >= count)
                {
                    return emails[count - 1];
                }
                await Task.Delay(50);
            }
            throw new TimeoutException($"Email number {count} to {address} didn't arrive.");
        }

        // The first email to this address that matches.
        public async Task<EmailMessage> WaitForAsync(string address, Func<EmailMessage, bool> match)
        {
            var deadline = DateTime.UtcNow + Timeout;
            while (DateTime.UtcNow < deadline)
            {
                if (To(address).FirstOrDefault(match) is { } email)
                {
                    return email;
                }
                await Task.Delay(50);
            }
            throw new TimeoutException($"No matching email to {address} arrived.");
        }

        // For emails that must not go out: long enough for one that would have been sent in the background.
        public static Task SettleAsync() => Task.Delay(500);
    }

    // The real time plus however far a test moved it forward.
    public sealed class TestClock : TimeProvider
    {
        private long _offsetTicks;

        public override DateTimeOffset GetUtcNow() => base.GetUtcNow() + TimeSpan.FromTicks(Interlocked.Read(ref _offsetTicks));

        public void Advance(TimeSpan by) => Interlocked.Add(ref _offsetTicks, by.Ticks);
    }
}
