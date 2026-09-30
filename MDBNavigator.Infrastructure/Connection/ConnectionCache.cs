using MDBNavigator.Application.Contracts;
using MDBNavigator.Domain.ValueObjects;
using System.Collections.Concurrent;
using System.Diagnostics.CodeAnalysis;

namespace MDBNavigator.Infrastructure.Connection
{
    public class ConnectionCache : IConnectionCache
    {
        private readonly ConcurrentDictionary<string, ConnectionSettings> _cache = new();

        public void Set(string key, ConnectionSettings settings) => _cache[key] = settings;

        public bool TryGet(string key, [NotNullWhen(true)] out ConnectionSettings? settings)
            => _cache.TryGetValue(key, out settings);

        public bool Remove(string key) => _cache.TryRemove(key, out _);
    }
}
