using MDBNavigator.Providers.Abstractions;

namespace MDBNavigator.Connections.Domain
{
    // A connection a user keeps for later: everything needed to connect, and optionally the password (encrypted, 1.2c).
    // OwnerId is the user id from the session key: the account's GUID, or "local" with Auth:Mode None.
    public class SavedConnection
    {
        public Guid Id { get; set; } = Guid.CreateVersion7();
        public required string OwnerId { get; set; }

        public string Name { get; set; } = string.Empty;
        // Name.Trim().ToUpperInvariant(): names are unique per owner ignoring case (like Identity's NormalizedEmail).
        public string NormalizedName { get; set; } = string.Empty;

        public ServerType ServerType { get; set; }
        public string ServerName { get; set; } = string.Empty;
        public int Port { get; set; }
        // Optional: opened on connect when a request names no database.
        public string? DatabaseName { get; set; }
        public string UserName { get; set; } = string.Empty;
        // "#rrggbb" in lower case, or null: the UI then picks a color from the server's address.
        public string? Color { get; set; }
        // The remembered password, encrypted by ISavedPasswordProtector; null when none is remembered. Never leaves the
        // server: the DTO only says whether there is one.
        public byte[]? ProtectedPassword { get; set; }

        public DateTime CreatedAtUtc { get; set; }
        public DateTime UpdatedAtUtc { get; set; }
    }
}
