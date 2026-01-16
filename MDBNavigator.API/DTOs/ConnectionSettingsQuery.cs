namespace MDBNavigator.API.DTOs
{
    public class ConnectionSettingsQuery
    {
        public required string ServerType { get; set; }
        public required string ServerName { get; set; }
        public required int Port { get; set; }
        public required string UserName { get; set; }
        public required string Password { get; set; }
    }
}
