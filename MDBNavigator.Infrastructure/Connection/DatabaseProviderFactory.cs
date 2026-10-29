using MDBNavigator.Application.Contracts;
using MDBNavigator.Domain.ValueObjects;

namespace MDBNavigator.Infrastructure.Connection
{
    public class DatabaseProviderFactory : IDatabaseProviderFactory
    {
        private readonly IEnumerable<IDbServerFactory> _serverFactories;

        public DatabaseProviderFactory(IEnumerable<IDbServerFactory> serverFactories)
            => _serverFactories = serverFactories;

        public async Task<IDatabaseProvider> CreateAsync(ConnectionSettings settings, string? databaseName = null, CancellationToken ct = default)
        {
            var factory = _serverFactories.FirstOrDefault(f => f.ServerType == settings.ServerType)
                ?? throw new NotSupportedException($"No provider registered for server type '{settings.ServerType}'.");

            return await factory.CreateAsync(settings, databaseName, ct);
        }
    }
}
