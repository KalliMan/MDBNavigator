using MDBNavigator.Connections.Application;
using MDBNavigator.Connections.Application.SavedConnections;
using MDBNavigator.Connections.Infrastructure.Passwords;
using MDBNavigator.Connections.Infrastructure.Persistence;
using MDBNavigator.Connections.Infrastructure.UserData;
using MDBNavigator.SharedKernel.UserData;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;

namespace MDBNavigator.Connections.Infrastructure
{
    public static class ConnectionsModule
    {
        // appDbConnectionString: the app's SQLite file, resolved by the API (AppDb). guardOptions: built in Program.cs,
        // because the guard's default mode depends on the auth settings.
        public static IServiceCollection AddConnectionsModule(this IServiceCollection services, IConfiguration configuration,
            string appDbConnectionString, ConnectionGuardOptions guardOptions)
        {
            services.AddConnectionsCore();

            services.AddSingleton(guardOptions);
            services.AddSingleton(
                configuration.GetSection(ConnectionCacheOptions.SectionName).Get<ConnectionCacheOptions>() ?? new ConnectionCacheOptions());
            services.AddSingleton(
                configuration.GetSection(FailedConnectOptions.SectionName).Get<FailedConnectOptions>() ?? new FailedConnectOptions());

            services.AddSingleton<IConnectionCache, ConnectionCache>();
            services.AddSingleton<IConnectionGuard, ConnectionGuard>();
            services.TryAddSingleton(TimeProvider.System);
            services.AddSingleton<IConnectAttemptLimiter, ConnectAttemptLimiter>();

            services.AddDbContext<ConnectionsDbContext>(options => ConnectionsDbContext.Configure(options, appDbConnectionString));
            services.AddScoped<ISavedConnectionStore, SavedConnectionStore>();
            services.AddScoped<IUserDataEraser, ConnectionsUserData>();

            // Parsed here, so a bad key stops startup. Registered in both auth modes, like the saved connections themselves.
            var savedConnections = configuration.GetSection(SavedConnectionOptions.SectionName).Get<SavedConnectionOptions>()
                ?? new SavedConnectionOptions();
            var passwordKey = SavedConnectionOptions.ParseKey(savedConnections.PasswordKey);
            services.AddSingleton<ISavedPasswordProtector>(sp =>
                new AesGcmSavedPasswordProtector(passwordKey, sp.GetRequiredService<ILogger<AesGcmSavedPasswordProtector>>()));

            return services;
        }
    }
}
