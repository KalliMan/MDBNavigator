namespace MDBNavigator.Application.DTOs.Command
{
    // Filled by IDatabaseProvider.StreamQuery while the stream is consumed.
    public class QueryStreamStats
    {
        public long RowCount { get; set; }
        public int RecordsAffected { get; set; } = -1;
    }
}
