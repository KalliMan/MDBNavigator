using Models;

namespace MDBNavigator.BL.Cache
{
    public interface IConnectionSettingsMemoryCache
    {
        public ConnectionSettings this[string key]
        {
            get;
            set;
        }

        public ConnectionSettings Get(string key);
        public void Set(string key, ConnectionSettings value);
        public void Remove(string key);
    }
}
