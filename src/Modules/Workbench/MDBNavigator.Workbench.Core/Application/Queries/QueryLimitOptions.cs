namespace MDBNavigator.Workbench.Application.Queries
{
    // The RateLimiting setting that belongs to running queries. The API's own rate limits read the same section.
    public class QueryLimitOptions
    {
        public const string SectionName = "RateLimiting";

        // Query runs of one user that are running or waiting for a worker. The QueryExecution:MaxConcurrentQueries
        // workers are shared by everyone, so without this one user's long queries could keep all of them busy.
        public int MaxRunningQueriesPerUser { get; set; } = 3;
    }
}
