using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MDBNavigator.Connections.Infrastructure.Persistence
{
    public static class ConnectionsDatabase
    {
        // Applies the module's migrations. Call after the accounts database is initialized: the saved_connections table
        // was first created by the accounts context's migrations (see AdoptSavedConnections), and that call also creates
        // the SQLite file's folder and sets WAL.
        public static async Task InitializeConnectionsDatabaseAsync(this IServiceProvider services, CancellationToken ct = default)
        {
            await using var scope = services.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<ConnectionsDbContext>();
            await db.Database.MigrateAsync(ct);
        }
    }
}
