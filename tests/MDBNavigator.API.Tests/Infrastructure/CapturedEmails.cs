using Gatehouse.Accounts;
using System.Collections.Concurrent;

namespace MDBNavigator.API.Tests.Infrastructure
{
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
