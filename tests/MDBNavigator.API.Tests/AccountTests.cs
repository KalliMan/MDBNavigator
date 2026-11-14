using MDBNavigator.API.Tests.Infrastructure;
using Microsoft.Data.Sqlite;
using System.Net;
using System.Net.Http.Json;

namespace MDBNavigator.API.Tests
{
    [Collection(ApiCollection.Name)]
    public class AccountTests
    {
        private readonly AppFixture _fixture;

        public AccountTests(AppFixture fixture) => _fixture = fixture;

        [Fact]
        public async Task Account_shows_the_email_and_that_a_password_is_set()
        {
            var (session, email, _) = await _fixture.NewUserAsync();
            using var signedIn = session;

            var response = await session.Client.GetAsync("/api/auth/account").ShouldBeAsync(HttpStatusCode.OK);

            var account = await response.JsonAsync();
            Assert.Equal(email, account.GetProperty("email").GetString());
            Assert.True(account.GetProperty("hasPassword").GetBoolean());
        }

        [Fact]
        public async Task The_password_can_be_changed()
        {
            var (session, email, password) = await _fixture.NewUserAsync();
            using var signedIn = session;
            const string newPassword = "another-smoke-password";

            await session.Client.PostAsJsonAsync("/api/auth/account/password", new { currentPassword = password, newPassword })
                .ShouldBeAsync(HttpStatusCode.NoContent);

            // SignInAsync checks for 200.
            using var again = await _fixture.SignInAsync(email, newPassword);
        }

        [Fact]
        public async Task Deleting_needs_the_right_password()
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            using var signedIn = session;

            await session.Client.PostAsJsonAsync("/api/auth/account/delete", new { password = "wrong" }).ShouldBeAsync(HttpStatusCode.BadRequest);

            await session.Client.GetAsync("/api/auth/me").ShouldBeAsync(HttpStatusCode.OK);
        }

        [Fact]
        public async Task Deleting_an_account_removes_everything_of_it()
        {
            var (session, email, password) = await _fixture.NewUserAsync();
            using var signedIn = session;
            var savedName = $"Deleted with the account {Guid.NewGuid():N}";
            await session.Client.PostAsJsonAsync("/api/savedConnections", new
            {
                name = savedName,
                serverType = "PostgreSQL",
                serverName = _fixture.PgHost,
                port = _fixture.PgPort,
                databaseName = AppFixture.Database,
                userName = AppFixture.PgUser,
                color = (string?)null,
                rememberPassword = false,
                password = (string?)null
            }).ShouldBeAsync(HttpStatusCode.Created);
            var connectionId = await session.ConnectAsync();

            await session.Client.PostAsJsonAsync("/api/auth/account/delete", new { password }).ShouldBeAsync(HttpStatusCode.NoContent);

            // The cached connection, with its database credentials, went with the account.
            var response = await session.Client.GetAsync($"/api/databaseSchema/databases/{connectionId}").ShouldBeAsync(HttpStatusCode.BadRequest);
            Assert.Contains("Not Connected", await response.ErrorMessageAsync());

            using var client = _fixture.CreateAnonymousClient();
            await client.PostAsJsonAsync("/api/auth/login?useCookies=true", new { email, password }).ShouldBeAsync(HttpStatusCode.Unauthorized);

            // No endpoint can show that the saved connection is gone with its owner, so this is the one place a test reads the file.
            using var sqlite = new SqliteConnection($"Data Source={_fixture.Factory.AppDbPath};Mode=ReadOnly");
            sqlite.Open();
            using var command = sqlite.CreateCommand();
            command.CommandText = "select count(*) from saved_connections where name = @name";
            command.Parameters.AddWithValue("@name", savedName);
            Assert.Equal(0L, command.ExecuteScalar());
        }
    }
}
