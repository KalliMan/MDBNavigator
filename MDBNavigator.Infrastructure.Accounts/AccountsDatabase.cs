using MDBNavigator.Infrastructure.Accounts.Identity;
using MDBNavigator.Infrastructure.Accounts.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace MDBNavigator.Infrastructure.Accounts
{
    public static class AccountsDatabase
    {
        // Creates or upgrades the app database, then makes sure the roles and the configured admin exist.
        // Runs at every start and changes nothing when everything is already in place.
        public static async Task InitializeAccountsDatabaseAsync(this IServiceProvider services, CancellationToken ct = default)
        {
            await using var scope = services.CreateAsyncScope();
            var provider = scope.ServiceProvider;
            var logger = provider.GetRequiredService<ILoggerFactory>().CreateLogger(typeof(AccountsDatabase));
            var db = provider.GetRequiredService<AccountsDbContext>();

            if (db.Database.IsSqlite())
            {
                // SQLite creates the file, but not its folder.
                var dataSource = new SqliteConnectionStringBuilder(db.Database.GetConnectionString()).DataSource;
                if (Path.GetDirectoryName(dataSource) is { Length: > 0 } folder)
                {
                    Directory.CreateDirectory(folder);
                }
            }

            await db.Database.MigrateAsync(ct);

            if (db.Database.IsSqlite())
            {
                // WAL: readers don't wait for a writer. EF Core sets it on files it creates; this also covers a file
                // created elsewhere (e.g. restored from a backup). It is stored in the file; repeating it is harmless.
                await db.Database.ExecuteSqlRawAsync("PRAGMA journal_mode=WAL;", ct);
            }

            await SeedRolesAsync(provider.GetRequiredService<RoleManager<IdentityRole<Guid>>>());

            var options = provider.GetRequiredService<AuthOptions>();
            var users = provider.GetRequiredService<UserManager<ApplicationUser>>();
            if (!string.IsNullOrWhiteSpace(options.Admin.Email))
            {
                if (await SeedAdminAsync(users, options.Admin.Email, options.Admin.Password))
                {
                    // No email in the log: it's personal data.
                    logger.LogInformation("Admin account created from Auth:Admin");
                }
            }
            else if (options.SignUp == SignUpMode.Closed && !await users.Users.AnyAsync(ct))
            {
                logger.LogWarning("Auth:SignUp is Closed and there are no accounts: set Auth:Admin:Email and Auth:Admin:Password to create the first one");
            }
        }

        private static async Task SeedRolesAsync(RoleManager<IdentityRole<Guid>> roles)
        {
            foreach (var name in RoleNames.All)
            {
                if (!await roles.RoleExistsAsync(name))
                {
                    ThrowIfFailed(await roles.CreateAsync(new IdentityRole<Guid>(name) { Id = Guid.CreateVersion7() }), $"Creating role {name}");
                }
            }
        }

        // Returns true when the account was created. An existing account is only made admin (its password is kept).
        private static async Task<bool> SeedAdminAsync(UserManager<ApplicationUser> users, string email, string? password)
        {
            var user = await users.FindByEmailAsync(email);
            var created = user is null;
            if (user is null)
            {
                if (string.IsNullOrEmpty(password))
                {
                    throw new InvalidOperationException("Auth:Admin:Password must be set to create the admin account.");
                }

                // The admin comes from our own configuration, so its email counts as confirmed.
                user = new ApplicationUser { UserName = email, Email = email, EmailConfirmed = true };
                ThrowIfFailed(await users.CreateAsync(user, password), "Creating the admin account");
            }

            if (!await users.IsInRoleAsync(user, RoleNames.Admin))
            {
                ThrowIfFailed(await users.AddToRoleAsync(user, RoleNames.Admin), "Making the account admin");
            }

            return created;
        }

        // Error codes only: Identity's descriptions can contain the email.
        private static void ThrowIfFailed(IdentityResult result, string action)
        {
            if (!result.Succeeded)
            {
                throw new InvalidOperationException($"{action} failed: {string.Join(", ", result.Errors.Select(e => e.Code))}");
            }
        }
    }
}
