using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Cryptography;

namespace MDBNavigator.API.Tests.Infrastructure
{
    // The real Program.cs, in memory, with settings that point it at a temporary app database and open sign-up.
    public sealed class ApiFactory : WebApplicationFactory<Program>
    {
        public const string AdminEmail = "admin@example.test";
        public const string AdminPassword = "correct-horse-battery";

        private readonly IReadOnlyDictionary<string, string> _settings;
        private readonly Action<IServiceCollection>? _configureServices;

        // settings: a fixture's own settings, applied after the defaults below so they win (LimitsAppFixture).
        // configureServices: replaces app services after the app registered its own (DemoAppFixture: email, clock).
        public ApiFactory(IReadOnlyDictionary<string, string>? settings = null, Action<IServiceCollection>? configureServices = null)
        {
            _settings = settings ?? new Dictionary<string, string>();
            _configureServices = configureServices;
        }

        public string AppDbPath { get; } = Path.Combine(Path.GetTempPath(), $"mdbnav-tests-{Guid.NewGuid():N}.db");

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            // Not Development: the owner's user secrets and appsettings.Development.json stay out of the tests.
            builder.UseEnvironment("Testing");

            // UseSetting, not ConfigureAppConfiguration: Program.cs reads its options while it builds the host, and only
            // UseSetting values are there that early.
            builder.UseSetting("ConnectionStrings:AppDb", $"Data Source={AppDbPath}");
            builder.UseSetting("Auth:Mode", "Accounts");
            builder.UseSetting("Auth:SignUp", "Open");
            builder.UseSetting("Auth:Admin:Email", AdminEmail);
            builder.UseSetting("Auth:Admin:Password", AdminPassword);
            builder.UseSetting("Email:Delivery", "None");
            builder.UseSetting("Captcha:Provider", "None");
            // The container is on localhost, which the default guard (Public, with open sign-up) refuses.
            builder.UseSetting("ConnectionGuard:Mode", "Off");
            builder.UseSetting("SavedConnections:PasswordKey", Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)));
            // The whole suite comes from one address within a minute.
            builder.UseSetting("RateLimiting:AuthRequestsPerMinute", "10000");
            builder.UseSetting("RateLimiting:ConnectsPerMinute", "10000");
            builder.UseSetting("RateLimiting:QueriesPerMinute", "10000");

            foreach (var (key, value) in _settings)
            {
                builder.UseSetting(key, value);
            }

            if (_configureServices is not null)
            {
                builder.ConfigureTestServices(_configureServices);
            }
        }
    }
}
