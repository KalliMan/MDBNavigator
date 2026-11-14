using MDBNavigator.Providers.Abstractions;
using System.Net;

namespace MDBNavigator.Providers.PostgreSQL
{
    public class PostgresProvider : IDatabaseProvider
    {
        public ServerType ServerType => ServerType.PostgreSQL;

        public async Task<IDatabaseClient> ConnectAsync(ConnectionSettings settings, IReadOnlyList<IPAddress> addresses, string? databaseName = null, CancellationToken ct = default)
            => await PostgresClient.OpenAsync(settings, addresses, databaseName, ct);
    }
}
