using MDBNavigator.Providers.Abstractions;

namespace MDBNavigator.Connections.Contracts
{
    // Opens a database on one of the session's connections. The session is "{userId}:{tabId}" (SessionKey).
    public interface IDatabaseConnector
    {
        // databaseName null or empty: the connection's own default database.
        // Throws NotConnectedException when the session has no such connection (never connected, disconnected, or
        // expired), and ConnectionNotAllowedException when the connection guard refuses the host now.
        Task<IDatabaseClient> OpenAsync(string sessionId, string connectionId, string? databaseName = null, CancellationToken ct = default);
    }
}
