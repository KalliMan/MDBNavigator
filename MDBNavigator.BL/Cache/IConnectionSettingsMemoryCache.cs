using Models.Connect;

namespace MDBNavigator.BL.Cache
{
    public interface IConnectionSettingsMemoryCache
    {
        public ConnectionSettings this[string key]
        {
            get;
            set;
        }

        public bool TryGetValue(string key, out ConnectionSettings? value);

        public bool Remove(string key);
    }
}
