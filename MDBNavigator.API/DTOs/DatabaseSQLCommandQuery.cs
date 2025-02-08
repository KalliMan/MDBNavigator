namespace MDBNavigator.API.DTOs
{
    public class DatabaseSQLCommandQuery
    {
        public required string Id { get; set; }
        public required string DatabaseName {  get; set; }
        public required string CmdQuery { get; set; }
    }
}
