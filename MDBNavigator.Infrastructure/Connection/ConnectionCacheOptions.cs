namespace MDBNavigator.Infrastructure.Connection
{
    public class ConnectionCacheOptions
    {
        public const string SectionName = "ConnectionCache";

        // A connection's settings are dropped after this long without any request using it;
        // the user then has to reconnect.
        public int SlidingExpirationMinutes { get; set; } = 480;
    }
}
