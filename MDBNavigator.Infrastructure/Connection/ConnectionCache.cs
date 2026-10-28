using MDBNavigator.Application.Contracts;
using MDBNavigator.Domain.ValueObjects;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Caching.Memory;
using System.Diagnostics.CodeAnalysis;

namespace MDBNavigator.Infrastructure.Connection
{
    // Connection settings per session + connection. Entries expire when unused, and passwords are
    // kept encrypted with a key that lives only in this process (lost on restart, like the cache itself).
    public class ConnectionCache : IConnectionCache, IDisposable
    {
        private sealed record CachedConnection(ConnectionSettings SettingsWithoutPassword, string ProtectedPassword);

        private readonly MemoryCache _cache = new(new MemoryCacheOptions());
        private readonly IDataProtector _protector =
            new EphemeralDataProtectionProvider().CreateProtector("MDBNavigator.ConnectionCache");
        private readonly TimeSpan _slidingExpiration;

        public ConnectionCache(ConnectionCacheOptions options)
        {
            _slidingExpiration = TimeSpan.FromMinutes(Math.Max(1, options.SlidingExpirationMinutes));
        }

        public void Set(string key, ConnectionSettings settings)
        {
            var entry = new CachedConnection(
                settings with { Password = string.Empty },
                _protector.Protect(settings.Password));

            _cache.Set(key, entry, new MemoryCacheEntryOptions { SlidingExpiration = _slidingExpiration });
        }

        // Every successful lookup also extends the entry's lifetime (sliding expiration).
        public bool TryGet(string key, [NotNullWhen(true)] out ConnectionSettings? settings)
        {
            if (_cache.TryGetValue(key, out CachedConnection? entry) && entry is not null)
            {
                settings = entry.SettingsWithoutPassword with { Password = _protector.Unprotect(entry.ProtectedPassword) };
                return true;
            }

            settings = null;
            return false;
        }

        public bool Remove(string key)
        {
            var existed = _cache.TryGetValue(key, out _);
            _cache.Remove(key);
            return existed;
        }

        public void Dispose() => _cache.Dispose();
    }
}
