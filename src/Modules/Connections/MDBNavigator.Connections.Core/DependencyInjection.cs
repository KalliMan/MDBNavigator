using MDBNavigator.Connections.Application;
using MDBNavigator.Connections.Application.SavedConnections;
using MDBNavigator.Connections.Contracts;
using MDBNavigator.SharedKernel;
using Microsoft.Extensions.DependencyInjection;

namespace MDBNavigator.Connections
{
    public static class DependencyInjection
    {
        // Handlers, validators and the module's own services. Called by AddConnectionsModule.
        public static IServiceCollection AddConnectionsCore(this IServiceCollection services)
        {
            services.AddHandlersFromAssembly(typeof(DependencyInjection).Assembly);
            services.AddScoped<DatabaseConnector>();
            services.AddScoped<IDatabaseConnector>(sp => sp.GetRequiredService<DatabaseConnector>());
            services.AddScoped<ConnectionOpener>();
            services.AddScoped<RememberedPasswordResolver>();
            return services;
        }
    }
}
