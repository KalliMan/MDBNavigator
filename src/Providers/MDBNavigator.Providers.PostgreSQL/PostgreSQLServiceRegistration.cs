using MDBNavigator.Providers.Abstractions;
using Microsoft.Extensions.DependencyInjection;

namespace MDBNavigator.Providers.PostgreSQL
{
    public static class PostgreSQLServiceRegistration
    {
        public static IServiceCollection AddPostgreSQLProvider(this IServiceCollection services)
        {
            services.AddScoped<IDatabaseProvider, PostgresProvider>();
            services.AddSingleton<IDatabaseErrorDescriber, PostgresErrorDescriber>();
            return services;
        }
    }
}
