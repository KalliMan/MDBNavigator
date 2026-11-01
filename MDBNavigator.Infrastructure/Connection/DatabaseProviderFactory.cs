using MDBNavigator.Application.Contracts;
using MDBNavigator.Domain.ValueObjects;

namespace MDBNavigator.Infrastructure.Connection
{
    public class DatabaseProviderFactory : IDatabaseProviderFactory
    {
        private readonly IEnumerable<IDbServerFactory> _serverFactories;
        private readonly IConnectionGuard _connectionGuard;

        public DatabaseProviderFactory(IEnumerable<IDbServerFactory> serverFactories, IConnectionGuard connectionGuard)
        {
            _serverFactories = serverFactories;
            _connectionGuard = connectionGuard;
        }

        // Every connection opens here (connect, reconnect, and each request on a cached connection), so the guard
        // checks the host each time, and a name that later resolves somewhere else is caught too.
        public async Task<IDatabaseProvider> CreateAsync(ConnectionSettings settings, string? databaseName = null, CancellationToken ct = default)
        {
            var factory = _serverFactories.FirstOrDefault(f => f.ServerType == settings.ServerType)
                ?? throw new NotSupportedException($"No provider registered for server type '{settings.ServerType}'.");

            var addresses = await _connectionGuard.GetAllowedAddressesAsync(settings.ServerName, ct);
            return await factory.CreateAsync(settings, addresses, databaseName, ct);
        }
    }
}
