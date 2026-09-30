namespace MDBNavigator.API.DTOs
{
    public record DatabaseSQLCommandQuery
    {
        public required string ConnectionId { get; set; }
        public required string Id { get; set; }
        public required string DatabaseName {  get; set; }
        public required string CmdQuery { get; set; }
    }
}
