using MDBNavigator.Accounts.Email;
using MDBNavigator.Accounts.Identity;
using MDBNavigator.Accounts.Persistence;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace MDBNavigator.Accounts
{
    public static class AccountsModule
    {
        public const int PasswordMinLength = 10;

        // The app database's account tables, in both auth modes (with Auth:Mode None they stay empty: the file is shared
        // with the connections module). AddAccounts needs it registered first.
        public static IServiceCollection AddAppDatabase(this IServiceCollection services, string connectionString)
        {
            services.AddDbContext<AccountsDbContext>(options => AccountsDbContext.Configure(options, connectionString));
            // Read by GET /health: the check opens a connection to the file through this context.
            services.AddHealthChecks().AddDbContextCheck<AccountsDbContext>("accounts-db");
            return services;
        }

        // Identity with its API endpoints (mapped by the API under /api/auth), the session cookie, the external providers,
        // and the Data Protection keys in the app database. Only for Auth:Mode = Accounts, after AddAppDatabase.
        public static IServiceCollection AddAccounts(this IServiceCollection services, IConfiguration configuration, IHostEnvironment environment)
        {
            var email = configuration.GetSection(EmailOptions.SectionName).Get<EmailOptions>() ?? new EmailOptions();
            ValidateEmailOptions(email, environment);

            services.AddIdentityApiEndpoints<ApplicationUser>(options =>
                {
                    options.User.RequireUniqueEmail = true;
                    // Only when email can be sent. Applies to password sign-in; provider sign-in doesn't depend on it
                    // (see ExternalLogins).
                    options.SignIn.RequireConfirmedEmail = email.Enabled;

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
            services.AddScoped<AccountManagement>();

            // Without stored keys, every restart would sign everybody out.
            services.AddDataProtection()
                .SetApplicationName("MDBNavigator")
                .PersistKeysToDbContext<AccountsDbContext>();

            services.AddSingleton(email);
            if (email.Enabled)
            {
                services.AddSingleton<IEmailDelivery>(sp => email.Delivery == EmailDelivery.Log
                    ? ActivatorUtilities.CreateInstance<LogEmailDelivery>(sp)
                    : ActivatorUtilities.CreateInstance<SmtpEmailDelivery>(sp));
                // Replaces Identity's default sender, which sends nothing. Without email that default stays.
                services.AddSingleton<IEmailSender<ApplicationUser>, IdentityEmailSender>();
            }

            return services;
        }

        // Fails at startup rather than at the first email.
        private static void ValidateEmailOptions(EmailOptions email, IHostEnvironment environment)
        {
            if (!email.Enabled)
            {
                return;
            }
            if (email.Delivery == EmailDelivery.Log && !environment.IsDevelopment())
            {
                throw new InvalidOperationException("Email:Delivery 'Log' is allowed in Development only.");
            }
            if (!Uri.TryCreate(email.AppBaseUrl, UriKind.Absolute, out _))
            {
                throw new InvalidOperationException("Email:AppBaseUrl must be the app's absolute address, e.g. https://mdbnavigator.example.com.");
            }
            if (email.Delivery == EmailDelivery.Smtp && (email.Smtp.Host.Length == 0 || email.FromAddress.Length == 0))
            {
                throw new InvalidOperationException("Email:Smtp:Host and Email:FromAddress must be set when Email:Delivery is 'Smtp'.");
            }
        }
    }
}
