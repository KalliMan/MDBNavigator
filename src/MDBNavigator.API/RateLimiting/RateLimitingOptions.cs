namespace MDBNavigator.API.RateLimiting
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
    }
}
