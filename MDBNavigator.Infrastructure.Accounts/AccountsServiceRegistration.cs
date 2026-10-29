using MDBNavigator.Infrastructure.Accounts.Identity;
using MDBNavigator.Infrastructure.Accounts.Persistence;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace MDBNavigator.Infrastructure.Accounts
{
    public static class AccountsServiceRegistration
    {
        public const string ConnectionStringName = "AppDb";
        public const string DefaultConnectionString = "Data Source=data/mdbnavigator.db";

        public const int PasswordMinLength = 10;

        // Identity with its API endpoints (mapped by the API under /api/auth), the session cookie, the external
        // providers, and the Data Protection keys in the app database. Only for Auth:Mode = Accounts.
        public static IServiceCollection AddAccounts(this IServiceCollection services, IConfiguration configuration, IHostEnvironment environment)
        {
            var connectionString = ResolveConnectionString(
                configuration.GetConnectionString(ConnectionStringName) ?? DefaultConnectionString,
                environment.ContentRootPath);

            services.AddDbContext<AccountsDbContext>(options => AccountsDbContext.Configure(options, connectionString));

            services.AddIdentityApiEndpoints<ApplicationUser>(options =>
                {
                    options.User.RequireUniqueEmail = true;
                    // Switched on in step 0.1c, when email can be sent.
                    options.SignIn.RequireConfirmedEmail = false;

                    // Length over composition rules (current NIST guidance).
                    options.Password.RequiredLength = PasswordMinLength;
                    options.Password.RequireDigit = false;
                    options.Password.RequireLowercase = false;
                    options.Password.RequireUppercase = false;
                    options.Password.RequireNonAlphanumeric = false;
                    options.Password.RequiredUniqueChars = 1;

                    options.Lockout.AllowedForNewUsers = true;
                    options.Lockout.MaxFailedAccessAttempts = 5;
                    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
                })
                .AddRoles<IdentityRole<Guid>>()
                .AddEntityFrameworkStores<AccountsDbContext>();

            // Unauthenticated API calls get 401, not a redirect: Identity's API scheme challenges with its bearer handler.
            services.AddOptions<CookieAuthenticationOptions>(IdentityConstants.ApplicationScheme)
                .Configure(options =>
                {
                    options.Cookie.Name = "mdbnav_session";
                    options.Cookie.HttpOnly = true;
                    // Lax keeps the cookie off cross-site POSTs and lets the social sign-in redirect back to us work.
                    options.Cookie.SameSite = SameSiteMode.Lax;
                    options.Cookie.SecurePolicy = environment.IsDevelopment()
                        ? CookieSecurePolicy.SameAsRequest
                        : CookieSecurePolicy.Always;
                    options.ExpireTimeSpan = TimeSpan.FromDays(14);
                    options.SlidingExpiration = true;
                });

            // Google / Microsoft / GitHub, each only when configured.
            services.AddAuthentication().AddExternalProviders(configuration);
            services.AddScoped<ExternalLogins>();

            // Without stored keys, every restart would sign everybody out.
            services.AddDataProtection()
                .SetApplicationName("MDBNavigator")
                .PersistKeysToDbContext<AccountsDbContext>();

            return services;
        }

        // A relative file path is taken from the app's folder, not the current directory, so the database is in the
        // same place however the app is started (Visual Studio, dotnet run, a container).
        private static string ResolveConnectionString(string connectionString, string contentRootPath)
        {
            var builder = new SqliteConnectionStringBuilder(connectionString);
            if (builder.DataSource != ":memory:" && !Path.IsPathRooted(builder.DataSource))
            {
                builder.DataSource = Path.GetFullPath(Path.Combine(contentRootPath, builder.DataSource));
            }
            return builder.ToString();
        }
    }
}
