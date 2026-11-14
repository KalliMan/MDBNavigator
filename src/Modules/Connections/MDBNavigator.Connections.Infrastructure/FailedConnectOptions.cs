namespace MDBNavigator.Connections.Infrastructure
{
    // The two RateLimiting settings that belong to connecting. The API's own rate limits read the same section.
    public class FailedConnectOptions
    {
        public const string SectionName = "RateLimiting";

        // Failed connects within FailedConnectWaitMinutes after which connecting is refused for FailedConnectWaitMinutes.
        public int FailedConnectsBeforeWait { get; set; } = 5;
        public int FailedConnectWaitMinutes { get; set; } = 10;
    }
}
