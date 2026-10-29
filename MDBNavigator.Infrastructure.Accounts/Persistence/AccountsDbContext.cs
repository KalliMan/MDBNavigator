using MDBNavigator.Infrastructure.Accounts.Identity;
using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace MDBNavigator.Infrastructure.Accounts.Persistence
{
    // Identity's tables and the Data Protection keys (which keep sign-in cookies valid across restarts).
    public class AccountsDbContext(DbContextOptions<AccountsDbContext> options)
        : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>(options), IDataProtectionKeyContext
    {
        public DbSet<DataProtectionKey> DataProtectionKeys => Set<DataProtectionKey>();

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
        }
    }
}
