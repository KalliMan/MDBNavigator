
using System.Collections.Concurrent;
using System.Diagnostics.CodeAnalysis;

namespace MDBNavigator.BL.Cache
{
    public class GenericMemoryCache<T>
        where T : class
    {
        private readonly ConcurrentDictionary<string, T> _cache = new();

        public T this[string key]
        {
            get => _cache[key];
            set => _cache[key] = value;
        }

        public bool TryGetValue(string key, [NotNullWhen(true)] out T? value)
            => _cache.TryGetValue(key, out value);

        public bool Remove(string key)
            => _cache.TryRemove(key, out _);
    }

}
