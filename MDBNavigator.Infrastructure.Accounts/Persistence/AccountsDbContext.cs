using MDBNavigator.Application.Features.SavedConnections;
using MDBNavigator.Domain.Entities;
using MDBNavigator.Infrastructure.Accounts.Identity;
using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace MDBNavigator.Infrastructure.Accounts.Persistence
{
    // The app database: Identity's tables, saved connections, and the Data Protection keys (which keep sign-in cookies
    // valid across restarts). Used with Auth:Mode None too, for the local user's saved connections.
    public class AccountsDbContext(DbContextOptions<AccountsDbContext> options)
        : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>(options), IDataProtectionKeyContext
    {
        public DbSet<DataProtectionKey> DataProtectionKeys => Set<DataProtectionKey>();
        public DbSet<SavedConnection> SavedConnections => Set<SavedConnection>();

        // The same options at runtime and for the EF Core tools, so migrations match what the app uses.
        public static DbContextOptionsBuilder Configure(DbContextOptionsBuilder options, string connectionString)
            => options.UseSqlite(connectionString).UseSnakeCaseNamingConvention();

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Plain names instead of Identity's "AspNetUsers" etc. (snake_case comes from the naming convention).
            builder.Entity<ApplicationUser>().ToTable("users");
            builder.Entity<IdentityRole<Guid>>().ToTable("roles");
            builder.Entity<IdentityUserRole<Guid>>().ToTable("user_roles");
            builder.Entity<IdentityUserClaim<Guid>>().ToTable("user_claims");
            builder.Entity<IdentityUserLogin<Guid>>().ToTable("user_logins");
            builder.Entity<IdentityUserToken<Guid>>().ToTable("user_tokens");
            builder.Entity<IdentityRoleClaim<Guid>>().ToTable("role_claims");
            builder.Entity<DataProtectionKey>().ToTable("data_protection_keys");

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
                // there; AccountManagement.DeleteAsync removes an account's rows itself.
                connection.HasIndex(c => new { c.OwnerId, c.NormalizedName }).IsUnique();
            });
        }
    }
}
