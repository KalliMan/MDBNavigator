using MDBNavigator.API.Core;
using MDBNavigator.API.SignalR;
using MDBNavigator.BL.Cache;
using MDBNavigator.BL.Services;
using MDBNavigator.BL.SignalR;

namespace MDBNavigator.API.Extensions
{
    public static class ApplicationServicesExtensions
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
        {
            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            services.AddEndpointsApiExplorer();
            //services.AddSwaggerGen();
            //services.AddDbContext<DataContext>(opt =>
            //{
            //    opt.UseNpgsql(configuration.GetConnectionString("DefaultConnection"));
            //});

            services.AddCors(opt =>
            {
                opt.AddPolicy("CorsPolicy", policy =>
                {
                    policy
                    .AllowAnyMethod()
                    .AllowAnyHeader()
                    .AllowCredentials()
                    .AllowAnyOrigin()
                    .WithOrigins("http://localhost:5173");
                });
            });

            //services.AddAuthentication(
            //    CertificateAuthenticationDefaults.AuthenticationScheme)
            //    .AddCertificate();

            //services.ConfigureApplicationCookie(options =>
            //{
            //    options.Cookie.Che
            //    //options.Cookie.Name = ".AspNetCore.Identity.Application";
            //    //options.ExpireTimeSpan = TimeSpan.FromMinutes(10);
            //    //options.Cookie.MaxAge = TimeSpan.FromMinutes(10);
            //    //options.SlidingExpiration = true;
            //});

            services.AddDistributedMemoryCache();
            services.Configure<CookiePolicyOptions>(options =>
            {
                options.CheckConsentNeeded = context => true; // consent required
                options.MinimumSameSitePolicy = SameSiteMode.None;
            });

            // This was missing:
            services.AddSession(options =>
            {
                options.Cookie.Name = ".AdventureWorks.Session";
                options.IdleTimeout = TimeSpan.FromSeconds(10);
                options.Cookie.HttpOnly = false;
                options.Cookie.IsEssential = true;
                options.Cookie.SameSite = SameSiteMode.None;
            });
            //added to access session

            services.AddMemoryCache();
            services.AddSignalR();

            //services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining<List.Handler>());
            services.AddAutoMapper(typeof(MappingProfiles));

            //services.AddFluentValidationAutoValidation();
            //services.AddValidatorsFromAssemblyContaining<Create>();

//            services.AddSignalR();
            //services.AddHttpContextAccessor();
            services.AddScoped<IDBManager, DBManager>();
            services.AddSingleton<IConnectionSettingsMemoryCache, ConnectionSettingsMemoryCache>();
            //            services.AddSingleton<IBatchCommandResultHub, BatchCommandResultHub>();

            //services.AddSingleton<IBackgroundTaskQueue, BackgroundTaskQueue>();
            //services.AddHostedService<BackgroundQueueHostedService>();

            services.AddScoped<IBatchCommandResultHubProxy, BatchCommandResultHubProxy>();
            
//            services.AddScoped<IBatchResultNotification, BatchResultNotificationHubProxy>();
            //services.AddScoped<IPhotoAccessor, PhotoAccessor>();
            //services.Configure<CloudinarySettings>(configuration.GetSection("Cloudinary"));


            return services;
        }
    }
}
