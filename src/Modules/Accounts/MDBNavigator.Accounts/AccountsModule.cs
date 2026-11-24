using Gatehouse.Accounts;
using MDBNavigator.Accounts.Demo;
using MDBNavigator.Accounts.Email;
using MDBNavigator.Accounts.Identity;
using MDBNavigator.Accounts.Persistence;
using MDBNavigator.SharedKernel.Violations;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
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
        // the Data Protection keys in the app database, and the demo's guests. Only for Auth:Mode = Accounts, after
        // AddAppDatabase.
        public static IServiceCollection AddAccounts(this IServiceCollection services, IConfiguration configuration, IHostEnvironment environment,
            DemoOptions demo)
        {
            // Gatehouse.Accounts binds and checks this section itself, when the host starts (AddGatehouseAccountEmails below).
            // Read here too, because two things need it while the services are registered: the demo's check and Identity's
            // RequireConfirmedEmail.
            var email = configuration.GetSection(EmailOptions.SectionName).Get<EmailOptions>() ?? new EmailOptions();
            demo.Validate(email);

            services.AddIdentityApiEndpoints<ApplicationUser>(options =>
                {
                    options.User.RequireUniqueEmail = true;
                    // Only when email can be sent. Applies to password sign-in; provider sign-in doesn't depend on it
                    // (Gatehouse.Accounts' sign-in rules).
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

                    // Identity's own check (the security stamp) first, then a demo guest's session (GuestSessionValidator).
                    // Identity sets its handler when it adds the cookie, which runs before this.
                    var identityCheck = options.Events.OnValidatePrincipal;
                    options.Events.OnValidatePrincipal = async context =>
                    {
                        await identityCheck(context);
                        await GuestSessionValidator.ValidateAsync(context);
                    };
                });

            // Google / Microsoft / GitHub, each only when configured (Authentication:{Provider}:ClientId and ClientSecret), and
            // the rules that find, link or create the account: Gatehouse.Accounts. Where it offers a choice we keep our rule:
            // an account whose email was never confirmed is not linked to a provider account with the same email (the package's
            // default would hand it over), and a new account through a provider that doesn't verify emails stays unconfirmed
            // (the default). Must come after AddIdentityApiEndpoints.
            services.AddGatehouseExternalSignIn<ApplicationUser, AppExternalAccountHooks>(configuration, options =>
            {
                options.UnconfirmedAccountWithSameEmail = UnconfirmedAccountRule.Refuse;
            });
            services.AddScoped<AccountManagement>();

            // Demo guests: ending and cleaning up guests runs even with the demo off, so leftovers still go and visitors are
            // still deleted on time. Letting new guests in needs the demo on.
            services.TryAddSingleton(TimeProvider.System);
            services.AddScoped<GuestSessions>();
            services.AddSingleton<DemoCleanup>();
            services.AddHostedService<DemoCleanupService>();
            if (demo.Enabled)
            {
                services.AddSingleton<GuestStartGate>();
                services.AddScoped<DemoAccess>();
                // The other modules report refused actions through IViolationRecorder (SharedKernel); without the demo
                // nothing is registered and they skip it.
                services.AddSingleton<DemoViolations>();
                services.AddSingleton<IViolationRecorder>(sp => sp.GetRequiredService<DemoViolations>());
            }

            // Without stored keys, every restart would sign everybody out.
            services.AddDataProtection()
                .SetApplicationName("MDBNavigator")
                .PersistKeysToDbContext<AccountsDbContext>();

            // The email settings (checked when the host starts), delivery over SMTP, to the log or not at all, and Identity's
            // email sender: Gatehouse.Accounts. The texts are ours (AccountEmailComposer). With Email:Delivery None nothing is
            // sent, and the package logs a warning for each email that would have gone out.
            services.AddGatehouseAccountEmails<ApplicationUser, AccountEmailComposer>(configuration);

            return services;
        }
    }
}
