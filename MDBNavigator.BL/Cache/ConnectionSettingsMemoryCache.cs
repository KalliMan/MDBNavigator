using Models;

namespace MDBNavigator.BL.Cache
{
    public class ConnectionSettingsMemoryCache: GenericMemoryCache<ConnectionSettings>,
        IConnectionSettingsMemoryCache
    {
    }
}
