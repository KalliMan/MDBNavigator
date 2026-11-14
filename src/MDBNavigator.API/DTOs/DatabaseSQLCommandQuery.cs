namespace MDBNavigator.API.DTOs
{
    public record DatabaseSQLCommandQuery
    {
        public required string ConnectionId { get; set; }
        public required string DatabaseName {  get; set; }
        public required string CmdQuery { get; set; }
        // Unique per run of a streamed query; identifies the run for cancel and in all hub messages.
        public required string ExecutionId { get; set; }
    }
}
