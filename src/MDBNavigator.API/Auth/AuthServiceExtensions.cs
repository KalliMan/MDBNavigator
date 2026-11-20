using MDBNavigator.Accounts;
using MDBNavigator.Accounts.Demo;

namespace MDBNavigator.API.Auth
{
    public static class AuthServiceExtensions
    {
        public static IServiceCollection AddAuth(this IServiceCollection services, AuthOptions options, DemoOptions demo, IConfiguration configuration,
            IHostEnvironment environment, string appDbConnectionString)
        {
            // Guests get throwaway accounts: there is nothing to give them without accounts.
            if (demo.Enabled && options.Mode != AuthMode.Accounts)
            {
                throw new InvalidOperationException("Demo:Enabled needs Auth:Mode = Accounts.");
            }

            services.AddSingleton(options);
            services.AddSingleton(demo);

            // Both modes: with None the file is still the connections module's.
            services.AddAppDatabase(appDbConnectionString);

            if (options.Mode == AuthMode.Accounts)
            {
                services.AddAccounts(configuration, environment, demo);
            }
            else
            {
                // No schemes: nobody signs in, but the authentication middleware still needs its services.
                services.AddAuthentication();
            }
            services.AddAuthorization();

            return services;
        }
    }
}
