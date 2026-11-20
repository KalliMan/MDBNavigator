namespace MDBNavigator.Accounts.Demo
{
    // Lets one demo session start at a time, so two starts can't both see 9 guests and make 11, and counts the starts
    // per IP address within the last hour. In memory, per server instance, like the other rate limits; a restart forgets
    // the counts.
    public sealed class GuestStartGate
    {
        private static readonly TimeSpan Window = TimeSpan.FromHours(1);

        private readonly SemaphoreSlim _lock = new(1, 1);
        private readonly Dictionary<string, Queue<DateTime>> _startsByAddress = [];

        internal async Task<IDisposable> EnterAsync(CancellationToken ct)
        {
            await _lock.WaitAsync(ct);
            return new Release(_lock);
        }

        // Only inside EnterAsync.
        internal bool AddressAllowed(string address, DateTime now, int perHour)
        {
            Forget(now);
            return !_startsByAddress.TryGetValue(address, out var starts) || starts.Count < perHour;
        }

        // Only inside EnterAsync.
        internal void RecordStart(string address, DateTime now)
        {
            if (!_startsByAddress.TryGetValue(address, out var starts))
            {
                _startsByAddress[address] = starts = new Queue<DateTime>();
            }
            starts.Enqueue(now);
        }

        private void Forget(DateTime now)
        {
            foreach (var (address, starts) in _startsByAddress)
            {
                while (starts.TryPeek(out var oldest) && oldest <= now - Window)
                {
                    starts.Dequeue();
                }
                if (starts.Count == 0)
                {
                    _startsByAddress.Remove(address);
                }
            }
        }

        private sealed class Release(SemaphoreSlim semaphore) : IDisposable
        {
            private int _released;

            public void Dispose()
            {
                if (Interlocked.Exchange(ref _released, 1) == 0)
                {
                    semaphore.Release();
                }
            }
        }
    }
}
