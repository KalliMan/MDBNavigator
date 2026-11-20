using MDBNavigator.Accounts.Demo;
using MDBNavigator.Accounts.Identity;
using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace MDBNavigator.Accounts.Persistence
{
    // The app database's account tables: Identity's tables and the Data Protection keys (which keep sign-in cookies
    // valid across restarts). Used with Auth:Mode None too: the file is shared with the connections module.
    public class AccountsDbContext(DbContextOptions<AccountsDbContext> options)
        : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>(options), IDataProtectionKeyContext
    {
        public DbSet<DataProtectionKey> DataProtectionKeys => Set<DataProtectionKey>();

        // The public demo's guests (Demo/).
        public DbSet<DemoVisitor> DemoVisitors => Set<DemoVisitor>();
        public DbSet<DemoSignInLink> DemoSignInLinks => Set<DemoSignInLink>();
        public DbSet<DemoGuestSession> DemoGuestSessions => Set<DemoGuestSession>();

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

            builder.Entity<DemoVisitor>(visitor =>
            {
                visitor.ToTable("demo_visitors");
                visitor.Property(v => v.Name).HasMaxLength(DemoVisitor.NameMaxLength);
                visitor.Property(v => v.Email).HasMaxLength(DemoVisitor.EmailMaxLength);
                visitor.Property(v => v.NormalizedEmail).HasMaxLength(DemoVisitor.EmailMaxLength);
                visitor.Property(v => v.TermsVersion).HasMaxLength(20);
                visitor.Property(v => v.InviteName).HasMaxLength(DemoInviteCode.NameMaxLength);
                visitor.HasIndex(v => v.NormalizedEmail).IsUnique();
                visitor.HasIndex(v => v.LastVisitAtUtc);
            });

            builder.Entity<DemoSignInLink>(link =>
            {
                link.ToTable("demo_sign_in_links");
                link.Property(l => l.TokenHash).HasMaxLength(64);
                link.Property(l => l.Email).HasMaxLength(DemoVisitor.EmailMaxLength);
                link.Property(l => l.NormalizedEmail).HasMaxLength(DemoVisitor.EmailMaxLength);
                link.Property(l => l.Name).HasMaxLength(DemoVisitor.NameMaxLength);
                link.Property(l => l.TermsVersion).HasMaxLength(20);
                link.Property(l => l.InviteName).HasMaxLength(DemoInviteCode.NameMaxLength);
                link.HasIndex(l => l.TokenHash).IsUnique();
                // The links sent to one address within the last hour.
                link.HasIndex(l => new { l.NormalizedEmail, l.CreatedAtUtc });
                link.HasIndex(l => l.CreatedAtUtc);
            });

            builder.Entity<DemoGuestSession>(session =>
            {
                session.ToTable("demo_guest_sessions");
                // Checked on every request of a guest (GuestSessionValidator).
                session.HasIndex(s => s.UserId).IsUnique();
                session.HasIndex(s => new { s.VisitorId, s.StartedAtUtc });
                session.HasIndex(s => s.EndsAtUtc);
                session.HasOne<DemoVisitor>().WithMany().HasForeignKey(s => s.VisitorId).OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
