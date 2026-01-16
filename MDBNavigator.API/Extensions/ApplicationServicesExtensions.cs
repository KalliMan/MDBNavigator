using MDBNavigator.API.Core;
using MDBNavigator.BL.Cache;
using MDBNavigator.BL.Services;
using MDBNavigator.BL.BatchCommandResultHub;
using MDBNavigator.BL.BackgroundTaskQueue;
using MDBNavigator.API.HostedServices;
using MDBNavigator.API.SignalRHub;

namespace MDBNavigator.API.Extensions
{
    public static class ApplicationServicesExtensions
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
        {
            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            services.AddEndpointsApiExplorer();

            services.AddCors(opt =>
            {
                opt.AddPolicy("CorsPolicy", policy =>
                {
                    policy
                        .WithOrigins(
                            "http://localhost:3000",
                            "http://localhost:5173"
                        )
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();
                });
            });

            services.AddDataProtection();

            services.AddDistributedMemoryCache();
            services.Configure<CookiePolicyOptions>(options =>
            {
                options.CheckConsentNeeded = context => true; // consent required
                options.MinimumSameSitePolicy = SameSiteMode.None;
            });
/*
            services.AddSession(options =>
            {
                options.Cookie.Name = ".MDBNavigator.Session";
                options.IdleTimeout = TimeSpan.FromMinutes(20);
                options.Cookie.HttpOnly = true;
                options.Cookie.IsEssential = true;
                options.Cookie.SameSite = SameSiteMode.None;
            });
*/
            // added to access session
            services.AddMemoryCache();
            services.AddSignalR();

            services.AddAutoMapper(typeof(MappingProfiles));

            services.AddScoped<IDBManager, DBManager>();
            services.AddSingleton<IConnectionSettingsMemoryCache, ConnectionSettingsMemoryCache>();
            services.AddScoped<IBatchCommandResultHubProxy, BatchCommandResultHubProxy>();

            services.AddSingleton<IBackgroundTaskQueue, BackgroundTaskQueue>();
            services.AddHostedService<BackgroundQueueHostedService>();

            return services;
        }
    }
}
