using System.Net;

namespace MDBNavigator.Providers.Abstractions
{
    // One per database server type (PostgreSQL; later MS SQL Server). The app picks the provider by ServerType.
    public interface IDatabaseProvider
    {
        ServerType ServerType { get; }

        // Connects to one of the addresses (tried in order), never to settings.ServerName: the addresses are the ones
        // IConnectionGuard checked, and resolving the name again could give a different one.
        Task<IDatabaseClient> ConnectAsync(ConnectionSettings settings, IReadOnlyList<IPAddress> addresses, string? databaseName = null, CancellationToken ct = default);
    }
}
