using MDBNavigator.Application.Contracts;
using MDBNavigator.Domain.Enums;
using MDBNavigator.Domain.ValueObjects;

namespace MDBNavigator.Infrastructure.Connection
{
    public class DatabaseProviderFactory : IDatabaseProviderFactory
    {
        private readonly IEnumerable<IDbServerFactory> _serverFactories;

        public DatabaseProviderFactory(IEnumerable<IDbServerFactory> serverFactories)
            => _serverFactories = serverFactories;

        public async Task<IDatabaseProvider> CreateAsync(ConnectionSettings settings, string? databaseName = null)
        {
            if (!ServerTypes.TryParse(settings.ServerType, out var serverType))
            {
                throw new NotSupportedException($"Unsupported server type '{settings.ServerType}'.");
            }

            var factory = _serverFactories.FirstOrDefault(f => f.ServerType == serverType)
                ?? throw new NotSupportedException($"No provider registered for server type '{settings.ServerType}'.");

            return await factory.CreateAsync(settings, databaseName);
        }
    }
}
