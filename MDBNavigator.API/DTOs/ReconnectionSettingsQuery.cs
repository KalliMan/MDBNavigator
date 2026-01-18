namespace MDBNavigator.API.DTOs
{
    public class ReconnectionSettingsQuery
    {
        public required string ConnectionId { get; set; }

        public required string ServerType { get; set; }
        public required string ServerName { get; set; }
        public required string DatabaseName { get; set; }
        public int Port { get; set; }
        public required string UserName { get; set; }
        public required string Password { get; set; }
    }
}
