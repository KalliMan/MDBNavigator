using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Json;
using Testcontainers.PostgreSql;

namespace MDBNavigator.API.Tests.Infrastructure
{
    [CollectionDefinition(Name)]
    public sealed class ApiCollection : ICollectionFixture<AppFixture>
    {
        public const string Name = "API";
    }

    // One PostgreSQL container and one app for every test; the tests share them through the "API" collection.
    // Tests that depend on state use a fresh account (NewUserAsync), so they don't need to run in any order.
    public class AppFixture : IAsyncLifetime
    {
        public const string Database = "postgres";
        public const string PgUser = "postgres";
        public const string PgPassword = "postgres";
        public const string UserPassword = "smoke-test-password";

        // Read-only for the tests: nobody changes these objects.
        private const string SampleSchema = """"
            create table smoke_items (id int primary key, name varchar(50) not null, note text);
            insert into smoke_items values (1, 'one', null), (2, 'two', 'x');
            create view smoke_items_view as select id, name from smoke_items;
            create function smoke_add(a int, b int) returns int language sql as 'select a + b';
            create procedure smoke_noop() language sql as 'select 1';
            create schema "Smoke ""Quoted""";
            create table "Smoke ""Quoted"""."Mixed Case" ("Order Id" int primary key, "Note" text);
            create function smoke_add(a text, b text) returns text language sql as 'select a || b';
            """";

        private readonly PostgreSqlContainer _container = new PostgreSqlBuilder("postgres:17-alpine")
            .WithUsername(PgUser)
            .WithPassword(PgPassword)
            .WithDatabase(Database)
            .Build();

        private readonly IReadOnlyDictionary<string, string>? _settings;

        public AppFixture() : this(null)
        {
        }

        // For a fixture whose app runs with other settings (LimitsAppFixture).
        protected AppFixture(IReadOnlyDictionary<string, string>? settings)
        {
            _settings = settings;
        }

        // Once the container runs (PgHost and PgPort are set): the app's own settings. DemoAppFixture adds the container
        // as the demo connection.
        protected virtual IReadOnlyDictionary<string, string>? AppSettings() => _settings;

        // App services to replace, after the app registered its own.
        protected virtual void ConfigureServices(IServiceCollection services)
        {
        }

        public ApiFactory Factory { get; private set; } = null!;
        public string PgHost { get; private set; } = "";
        public int PgPort { get; private set; }

        public async Task InitializeAsync()
        {
            await _container.StartAsync();
            PgHost = _container.Hostname;
            PgPort = _container.GetMappedPublicPort(5432);

            var schema = await _container.ExecScriptAsync(SampleSchema);
            if (schema.ExitCode != 0)
            {
                throw new InvalidOperationException($"The sample schema failed (exit code {schema.ExitCode}): {schema.Stderr}");
            }

            Factory = new ApiFactory(AppSettings(), ConfigureServices);
            // Starts the app: Program.cs runs to the end, including the app database's migrations and the admin seed.
            _ = Factory.Server;

            // If the override had not taken, the app would be using src/MDBNavigator.API/data/mdbnavigator.db, the
            // owner's real database. Stop before any test touches it.
            if (!File.Exists(Factory.AppDbPath))
            {
                throw new InvalidOperationException(
                    $"The app did not create its temporary database at {Factory.AppDbPath}, so it may be using another one. Stopping.");
            }
        }

        public async Task DisposeAsync()
        {
            if (Factory is not null)
            {
                await Factory.DisposeAsync();

                // Pooled connections keep the file open, which would stop the delete on Windows.
                SqliteConnection.ClearAllPools();
                foreach (var path in new[] { Factory.AppDbPath, Factory.AppDbPath + "-wal", Factory.AppDbPath + "-shm" })
                {
                    if (File.Exists(path))
                    {
                        File.Delete(path);
                    }
                }
            }

            await _container.DisposeAsync();
        }

        // No cookie and no id header.
        public HttpClient CreateAnonymousClient() => Factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
            HandleCookies = false
        });

        public async Task<ApiSession> SignInAsync(string email, string password)
        {
            using var client = CreateAnonymousClient();
            var response = await client.PostAsJsonAsync("/api/auth/login?useCookies=true", new { email, password });
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            // Only the "name=value" part of each Set-Cookie header goes back; the attributes (Secure, HttpOnly, ...) are the browser's business.
            var cookie = string.Join("; ", response.Headers.GetValues("Set-Cookie").Select(value => value.Split(';')[0]));
            return new ApiSession(this, cookie, Guid.NewGuid().ToString());
        }

        public Task<ApiSession> SignInAsAdminAsync() => SignInAsync(ApiFactory.AdminEmail, ApiFactory.AdminPassword);

        public async Task<(ApiSession Session, string Email, string Password)> NewUserAsync()
        {
            var email = $"user-{Guid.NewGuid():N}@example.test";
            using (var client = CreateAnonymousClient())
            {
                var response = await client.PostAsJsonAsync("/api/auth/register", new { email, password = UserPassword });
                Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            }

            return (await SignInAsync(email, UserPassword), email, UserPassword);
        }

        public object ConnectBody(string? password = PgPassword, string serverType = "PostgreSQL", Guid? savedConnectionId = null) => new
        {
            serverType,
            serverName = PgHost,
            port = PgPort,
            userName = PgUser,
            password,
            databaseName = Database,
            savedConnectionId
        };
    }
}
