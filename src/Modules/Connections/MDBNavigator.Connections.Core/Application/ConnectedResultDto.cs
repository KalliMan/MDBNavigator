namespace MDBNavigator.Connections.Application
{
    public class ConnectedResultDto
    {
        public required string ConnectionId { get; set; }
        public required string ConnectionName { get; set; }
        public required string ServerName { get; set; }
        public int Port { get; set; }
        // By its API name ("PostgreSQL"), as the connect request and the saved connections write it. As the enum it
        // went out as a number, which the UI could not match with the name: the reconnect dialog then opened empty.
        public required string ServerType { get; set; }
        public required string UserName { get; set; }
        public string? DatabaseName { get; set; }
        // Set when this connection was opened with that saved connection's remembered password: a reconnect may send it
        // again instead of a password. Null for a typed password.
        public Guid? SavedConnectionId { get; set; }
    }
}
