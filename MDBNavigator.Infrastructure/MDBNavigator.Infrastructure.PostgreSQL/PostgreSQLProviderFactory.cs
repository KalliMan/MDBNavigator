using MDBNavigator.Application.Contracts;
using MDBNavigator.Domain.Enums;
using MDBNavigator.Domain.ValueObjects;

namespace MDBNavigator.Infrastructure.PostgreSQL
{
    public class PostgreSQLProviderFactory : IDbServerFactory
    {
        public ServerType ServerType => ServerType.PostgreSQL;

        public async Task<IDatabaseProvider> CreateAsync(ConnectionSettings settings, string? databaseName = null, CancellationToken ct = default)
        {
            var server = new PostgreSQLServer();
            await server.ConnectAsync(settings, databaseName, ct);
            return server;
        }
    }
}
