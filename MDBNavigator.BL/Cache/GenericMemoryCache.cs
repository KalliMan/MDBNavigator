using Models;

namespace MDBNavigator.BL.Cache
{
    public class GenericMemoryCache<T>
        where T : class
    {
        IDictionary<string, T> _cache = new Dictionary<string, T>();

        public T this[string key]
        {
            get => Get(key);
            set => Set(key, value);
        }

        public T Get(string key)
            => _cache[key];
        public void Set(string key, T value)
            => _cache[key] = value;

        public void Remove(string key)
            => _cache.Remove(key);
    }
}
