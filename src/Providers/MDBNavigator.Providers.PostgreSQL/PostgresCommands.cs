using Dapper;

namespace MDBNavigator.Providers.PostgreSQL
{
    internal static class PostgresCommands
    {
        // Dapper command carrying the request's cancellation token.
        internal static CommandDefinition Command(string sql, object? parameters = null, CancellationToken ct = default)
            => new(sql, parameters, cancellationToken: ct);
    }
}
