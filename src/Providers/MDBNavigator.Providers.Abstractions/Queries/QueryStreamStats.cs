namespace MDBNavigator.Providers.Abstractions.Queries
{
    // Filled by IQueryRunner.StreamQuery while the stream is consumed.
    public class QueryStreamStats
    {
        // Rows streamed, all result sets.
        public long RowCount { get; set; }
        // Summed over the statements that reported a count; -1 when none did.
        public int RecordsAffected { get; set; } = -1;
        // True when at least one result set stopped at the row limit.
        public bool Truncated { get; set; }
    }
}
