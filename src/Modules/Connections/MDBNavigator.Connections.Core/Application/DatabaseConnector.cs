using MDBNavigator.Connections.Contracts;
using MDBNavigator.Providers.Abstractions;

namespace MDBNavigator.Connections.Application
{
    // Every database connection opens here: connect, reconnect, and each request on a cached connection. So the
    // guard checks the host each time, and a name that later resolves somewhere else is caught too.
    public class DatabaseConnector : IDatabaseConnector
    {
        private readonly IEnumerable<IDatabaseProvider> _providers;
        private readonly IConnectionGuard _connectionGuard;
        private readonly IConnectionCache _cache;

        public DatabaseConnector(IEnumerable<IDatabaseProvider> providers, IConnectionGuard connectionGuard, IConnectionCache cache)
        {
            _providers = providers;
            _connectionGuard = connectionGuard;
            _cache = cache;
        }

        // The contract: looks the settings up in the cache.
        public Task<IDatabaseClient> OpenAsync(string sessionId, string connectionId, string? databaseName = null, CancellationToken ct = default)
        {
            if (!_cache.TryGet(sessionId, connectionId, out var settings))
            {
                throw new NotConnectedException("Not Connected! Please reconnect.");
            }

            return OpenAsync(settings, databaseName, ct);
        }

        // For settings that are not cached yet (the connect test).
        public async Task<IDatabaseClient> OpenAsync(ConnectionSettings settings, string? databaseName = null, CancellationToken ct = default)
        {
            var provider = _providers.FirstOrDefault(p => p.ServerType == settings.ServerType)
                ?? throw new NotSupportedException($"No provider registered for server type '{settings.ServerType}'.");

            var addresses = await _connectionGuard.GetAllowedAddressesAsync(settings.ServerName, ct);
            // A request without a database (the connect test, the database list) opens the connection's default one.
            var database = string.IsNullOrEmpty(databaseName) ? settings.DatabaseName : databaseName;
            return await provider.ConnectAsync(settings, addresses, database, ct);
        }
    }
}
