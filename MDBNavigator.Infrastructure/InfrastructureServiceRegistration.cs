using MDBNavigator.Application.Contracts;
using MDBNavigator.Infrastructure.BackgroundQueue;
using MDBNavigator.Infrastructure.Connection;
using MDBNavigator.Infrastructure.SignalR;
using Microsoft.Extensions.DependencyInjection;

namespace MDBNavigator.Infrastructure
{
    public static class InfrastructureServiceRegistration
    {
        public static IServiceCollection AddInfrastructureServices(this IServiceCollection services)
        {
            services.AddSingleton<IConnectionCache, ConnectionCache>();
            services.AddScoped<IDatabaseProviderFactory, DatabaseProviderFactory>();
            services.AddScoped<IBatchNotifier, BatchNotifier>();
            services.AddSingleton<IBackgroundTaskQueue, BackgroundTaskQueue>();
            services.AddHostedService<BackgroundQueueHostedService>();
            services.AddSignalR();

            return services;
        }
    }
}
