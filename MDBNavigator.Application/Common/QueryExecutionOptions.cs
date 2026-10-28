namespace MDBNavigator.Application.Common
{
    public class QueryExecutionOptions
    {
        public const string SectionName = "QueryExecution";

        // Rows per SignalR batch message.
        public int BatchSize { get; set; } = 500;

        // 0 = no timeout; long queries are stopped via the cancel endpoint.
        public int CommandTimeoutSeconds { get; set; } = 0;

        // Number of background workers executing streamed queries in parallel.
        public int MaxConcurrentQueries { get; set; } = 8;
    }
}
