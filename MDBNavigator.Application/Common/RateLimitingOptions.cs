namespace MDBNavigator.Application.Common
{
    // Limits per signed-in user (per IP address where nobody is signed in). 0 switches a limit off.
    public class RateLimitingOptions
    {
        public const string SectionName = "RateLimiting";

        // Sign-in, register, password and email requests per minute and IP address.
        public int AuthRequestsPerMinute { get; set; } = 10;

        // Connect and reconnect requests per minute.
        public int ConnectsPerMinute { get; set; } = 10;

        // Query runs started per minute.
        public int QueriesPerMinute { get; set; } = 60;

        // Query runs of one user that are running or waiting for a worker. The QueryExecution:MaxConcurrentQueries
        // workers are shared by everyone, so without this one user's long queries could keep all of them busy.
        public int MaxRunningQueriesPerUser { get; set; } = 3;

        // Failed connects within FailedConnectWaitMinutes after which connecting is refused for FailedConnectWaitMinutes.
        public int FailedConnectsBeforeWait { get; set; } = 5;

        public int FailedConnectWaitMinutes { get; set; } = 10;
    }
}
