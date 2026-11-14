using MDBNavigator.Providers.Abstractions;
using Npgsql;
using System.Net;
using System.Net.Sockets;

namespace MDBNavigator.Providers.PostgreSQL
{
    // Owns the connection. The three parts share it.
    public sealed class PostgresClient : IDatabaseClient
    {
        private readonly NpgsqlConnection _connection;

        private PostgresClient(NpgsqlConnection connection)
        {
            _connection = connection;
            Schema = new PostgresSchemaReader(connection);
            Scripts = new PostgresScriptGenerator(connection);
            Queries = new PostgresQueryRunner(connection);
        }

        public string DataSource => _connection.DataSource;
        public ISchemaReader Schema { get; }
        public IScriptGenerator Scripts { get; }
        public IQueryRunner Queries { get; }

        // The addresses come from IConnectionGuard; settings.ServerName is never handed to Npgsql (see IDatabaseProvider).
        internal static async Task<PostgresClient> OpenAsync(ConnectionSettings settings, IReadOnlyList<IPAddress> addresses, string? databaseName, CancellationToken ct)
        {
            var builder = new NpgsqlConnectionStringBuilder
            {
                Username = settings.UserName,
                Password = settings.Password,
                // Npgsql hides the server's error DETAIL by default (it may contain row values). In a database
                // tool the user is the database user, and the detail is what explains the error
                // (e.g. which objects block a DROP), so it is shown.
                IncludeErrorDetail = true,
            };

            if (settings.Port > 0) builder.Port = settings.Port;
            if (!string.IsNullOrEmpty(databaseName)) builder.Database = databaseName;

            // Npgsql tries each address of a host name until one accepts the connection ("localhost" is often ::1
            // and 127.0.0.1, and the server may listen on only one). Given the addresses instead, this does the same:
            // the next address is tried only when the network connection itself failed, never after the server
            // answered (a wrong password isn't retried) and not after a timeout (which would double the wait).
            for (var i = 0; i < addresses.Count; i++)
            {
                builder.Host = addresses[i].ToString();
                var connection = new NpgsqlConnection(builder.ConnectionString);
                try
                {
                    await connection.OpenAsync(ct);
                    return new PostgresClient(connection);
                }
                catch (NpgsqlException ex) when (i < addresses.Count - 1 && ex.InnerException is SocketException)
                {
                    await connection.DisposeAsync();
                }
                catch
                {
                    await connection.DisposeAsync();
                    throw;
                }
            }

            // Not reachable: IConnectionGuard never returns an empty list.
            throw new InvalidOperationException("No address to connect to.");
        }

        public ValueTask DisposeAsync() => _connection.DisposeAsync();
    }
}
