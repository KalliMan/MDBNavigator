using MDBNavigator.Application.Common;
using MDBNavigator.Application.Contracts;
using System.Collections.Concurrent;

namespace MDBNavigator.Infrastructure.Connection
{
    // In memory, so the counts are per server instance and start over on restart. That is enough for one instance;
    // several instances behind a load balancer would need a shared store.
    //
    // A successful connect doesn't reset the count: otherwise a script could connect to a database of its own
    // between guesses and never reach the limit.
    public class ConnectAttemptLimiter : IConnectAttemptLimiter
    {
        private sealed class UserAttempts
        {
            public Queue<DateTimeOffset> Failures { get; } = new();
            public DateTimeOffset? WaitUntil { get; set; }
            // Set under the lock when the entry is dropped from the dictionary; a writer that still holds it starts over.
            public bool Removed { get; set; }
        }

        private readonly ConcurrentDictionary<string, UserAttempts> _users = new();
        private readonly TimeProvider _time;
        private readonly int _failuresBeforeWait;
        // Both how far back failures count and how long the wait lasts.
        private readonly TimeSpan _period;
        // UTC ticks; read and swapped with Interlocked, since several requests can fail at the same moment.
        private long _nextCleanupTicks;

        public ConnectAttemptLimiter(RateLimitingOptions options, TimeProvider time)
        {
            _time = time;
            _failuresBeforeWait = options.FailedConnectsBeforeWait;
            _period = TimeSpan.FromMinutes(Math.Max(1, options.FailedConnectWaitMinutes));
            _nextCleanupTicks = (time.GetUtcNow() + _period).UtcTicks;
        }

        public TimeSpan? GetWait(string userId)
        {
            if (_failuresBeforeWait <= 0 || !_users.TryGetValue(userId, out var attempts))
            {
                return null;
            }

            var now = _time.GetUtcNow();
            lock (attempts)
            {
                return attempts.WaitUntil > now ? attempts.WaitUntil - now : null;
            }
        }

        public void RecordFailure(string userId)
        {
            if (_failuresBeforeWait <= 0)
            {
                return;
            }

            var now = _time.GetUtcNow();
            while (true)
            {
                var attempts = _users.GetOrAdd(userId, _ => new UserAttempts());
                lock (attempts)
                {
                    if (attempts.Removed)
                    {
                        continue;
                    }

                    DropOldFailures(attempts, now);
                    attempts.Failures.Enqueue(now);
                    if (attempts.Failures.Count >= _failuresBeforeWait)
                    {
                        // The wait replaces the count: once it ends, the user starts again with a clean slate.
                        attempts.WaitUntil = now + _period;
                        attempts.Failures.Clear();
                    }
                    break;
                }
            }

            RemoveIdleUsers(now);
        }

        private void DropOldFailures(UserAttempts attempts, DateTimeOffset now)
        {
            while (attempts.Failures.TryPeek(out var oldest) && oldest <= now - _period)
            {
                attempts.Failures.Dequeue();
            }
        }

        // At most once per period: users with no recent failures and no wait are forgotten, so the dictionary
        // holds only users who failed lately.
        private void RemoveIdleUsers(DateTimeOffset now)
        {
            // Only the caller that moves the time forward does the cleanup.
            var next = Interlocked.Read(ref _nextCleanupTicks);
            if (now.UtcTicks < next
                || Interlocked.CompareExchange(ref _nextCleanupTicks, (now + _period).UtcTicks, next) != next)
            {
                return;
            }

            foreach (var (userId, attempts) in _users)
            {
                lock (attempts)
                {
                    DropOldFailures(attempts, now);
                    if (attempts.Failures.Count == 0 && !(attempts.WaitUntil > now))
                    {
                        attempts.Removed = true;
                        _users.TryRemove(new KeyValuePair<string, UserAttempts>(userId, attempts));
                    }
                }
            }
        }
    }
}
