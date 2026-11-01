using MDBNavigator.Infrastructure.Accounts;

namespace MDBNavigator.API.Auth
{
    public static class AuthServiceExtensions
    {
        public static IServiceCollection AddAuth(this IServiceCollection services, AuthOptions options, IConfiguration configuration, IHostEnvironment environment)
        {
            services.AddSingleton(options);

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
