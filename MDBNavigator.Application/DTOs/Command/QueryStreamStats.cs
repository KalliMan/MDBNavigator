namespace MDBNavigator.Application.DTOs.Command
{
    // Filled by IDatabaseProvider.StreamQuery while the stream is consumed.
    public class QueryStreamStats
    {
        public long RowCount { get; set; }
        public int RecordsAffected { get; set; } = -1;
        // True when the stream stopped at the row limit.
        public bool Truncated { get; set; }
    }
}
