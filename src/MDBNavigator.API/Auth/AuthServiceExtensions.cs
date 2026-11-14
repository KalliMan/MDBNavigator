using MDBNavigator.Accounts;

namespace MDBNavigator.API.Auth
{
    public static class AuthServiceExtensions
    {
        public static IServiceCollection AddAuth(this IServiceCollection services, AuthOptions options, IConfiguration configuration, IHostEnvironment environment,
            string appDbConnectionString)
        {
            services.AddSingleton(options);

            // Both modes: with None the file is still the connections module's.
            services.AddAppDatabase(appDbConnectionString);

            if (options.Mode == AuthMode.Accounts)
            {
                services.AddAccounts(configuration, environment);
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
