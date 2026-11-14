using MDBNavigator.Connections.Application.SavedConnections;
using MDBNavigator.Connections.Domain;
using Microsoft.EntityFrameworkCore;

namespace MDBNavigator.Connections.Infrastructure.Persistence
{
    // Saved connections, in the app's SQLite file next to the accounts' tables, with a migrations history of its own.
    public class ConnectionsDbContext : DbContext
    {
        public const string MigrationsHistoryTable = "__ef_migrations_history_connections";

        public ConnectionsDbContext(DbContextOptions<ConnectionsDbContext> options) : base(options) { }

        public DbSet<SavedConnection> SavedConnections => Set<SavedConnection>();

        // The same options at runtime and for the EF Core tools, so migrations match what the app uses.
        public static DbContextOptionsBuilder Configure(DbContextOptionsBuilder options, string connectionString)
            => options.UseSqlite(connectionString, sqlite => sqlite.MigrationsHistoryTable(MigrationsHistoryTable))
                .UseSnakeCaseNamingConvention();

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<SavedConnection>(connection =>
            {
                connection.ToTable("saved_connections");
                connection.HasKey(c => c.Id);
                // GUID text for accounts, or "local".
                connection.Property(c => c.OwnerId).HasMaxLength(64);
                connection.Property(c => c.Name).HasMaxLength(SavedConnectionLimits.NameMaxLength);
                connection.Property(c => c.NormalizedName).HasMaxLength(SavedConnectionLimits.NameMaxLength);
                // By name ("PostgreSQL"), so the column reads well and doesn't depend on the enum's order.
                connection.Property(c => c.ServerType).HasConversion<string>().HasMaxLength(32);
                connection.Property(c => c.ServerName).HasMaxLength(SavedConnectionLimits.ServerNameMaxLength);
                connection.Property(c => c.DatabaseName).HasMaxLength(SavedConnectionLimits.DatabaseNameMaxLength);
                connection.Property(c => c.UserName).HasMaxLength(SavedConnectionLimits.UserNameMaxLength);
                connection.Property(c => c.Color).HasMaxLength(7);
                // Unique names per owner, ignoring case. No foreign key to users: the local user (Auth:Mode None) has no row
                // there; ConnectionsUserData removes an account's rows.
                connection.HasIndex(c => new { c.OwnerId, c.NormalizedName }).IsUnique();
            });
        }
    }
}
