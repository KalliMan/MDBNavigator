using MDBNavigator.Application.Contracts;
using Microsoft.Extensions.DependencyInjection;

namespace MDBNavigator.Infrastructure.PostgreSQL
{
    public static class PostgreSQLServiceRegistration
    {
        public static IServiceCollection AddPostgreSQLProvider(this IServiceCollection services)
        {
            services.AddScoped<IDbServerFactory, PostgreSQLProviderFactory>();
            return services;
        }
    }
}
