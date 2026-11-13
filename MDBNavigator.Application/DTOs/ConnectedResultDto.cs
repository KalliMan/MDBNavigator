using MDBNavigator.Domain.Enums;

namespace MDBNavigator.Application.DTOs
{
    public class ConnectedResultDto
    {
        public required string ConnectionId { get; set; }
        public required string ConnectionName { get; set; }
        public required string ServerName { get; set; }
        public int Port { get; set; }
        public required ServerType ServerType { get; set; }
        public required string UserName { get; set; }
        public string? DatabaseName { get; set; }
        // Set when this connection was opened with that saved connection's remembered password: a reconnect may send it
        // again instead of a password. Null for a typed password.
        public Guid? SavedConnectionId { get; set; }
    }
}
