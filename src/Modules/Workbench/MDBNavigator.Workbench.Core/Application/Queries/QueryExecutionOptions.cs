namespace MDBNavigator.Workbench.Application.Queries
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

        // Rows streamed per result set; 0 = unlimited. Protects the browser from one huge result.
        public int MaxRowsPerResultSet { get; set; } = 100_000;

        // Longest a run may take, from when a worker starts it; 0 = no limit. Unlike CommandTimeoutSeconds it can't be
        // switched off from SQL (SET statement_timeout = 0), and it also covers a script of many statements and a
        // result that keeps streaming.
        public int MaxRunSeconds { get; set; } = 0;

        // Rows streamed per run, over all its result sets; 0 = unlimited. MaxRowsPerResultSet alone lets a script of
        // many SELECTs stream any number of rows.
        public int MaxRowsPerRun { get; set; } = 0;

        // Bytes of values read per row; 0 = unlimited. A value that would take the row past it is cut (CutCellText),
        // so one huge value (repeat('x', 500000000)) can't fill the server's memory. Values of 1 KB or less are never cut.
        public int MaxRowBytes { get; set; } = 0;
    }
}
