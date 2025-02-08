using Models.Connect;

namespace MDBNavigator.BL.Cache
{
    public class ConnectionSettingsMemoryCache: GenericMemoryCache<ConnectionSettings>,
        IConnectionSettingsMemoryCache
    {
    }
}
