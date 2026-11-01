using MDBNavigator.Application.Contracts;
using MDBNavigator.Domain.Enums;
using MDBNavigator.Domain.ValueObjects;
using System.Net;

namespace MDBNavigator.Infrastructure.PostgreSQL
{
    public class PostgreSQLProviderFactory : IDbServerFactory
    {
        public ServerType ServerType => ServerType.PostgreSQL;

        public async Task<IDatabaseProvider> CreateAsync(ConnectionSettings settings, IReadOnlyList<IPAddress> addresses, string? databaseName = null, CancellationToken ct = default)
        {
            var server = new PostgreSQLServer();
            await server.ConnectAsync(settings, addresses, databaseName, ct);
            return server;
        }
    }
}
