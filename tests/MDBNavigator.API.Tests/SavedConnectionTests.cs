using MDBNavigator.API.Tests.Infrastructure;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace MDBNavigator.API.Tests
{
    [Collection(ApiCollection.Name)]
    public class SavedConnectionTests
    {
        private readonly AppFixture _fixture;

        public SavedConnectionTests(AppFixture fixture) => _fixture = fixture;

        // The container's host and port, the sample user and database.
        private object Body(string name, bool rememberPassword = false, string? password = null) => new
        {
            name,
            serverType = "PostgreSQL",
            serverName = _fixture.PgHost,
            port = _fixture.PgPort,
            databaseName = AppFixture.Database,
            userName = AppFixture.PgUser,
            color = (string?)null,
            rememberPassword,
            password
        };

        [Fact]
        public async Task A_saved_connection_can_be_created_read_changed_and_deleted()
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            using var signedIn = session;

            var created = await session.Client.PostAsJsonAsync("/api/savedConnections", Body("Smoke")).ShouldBeAsync(HttpStatusCode.Created);
            var createdJson = await created.JsonAsync();
            var id = createdJson.GetProperty("id").GetGuid();
            Assert.False(createdJson.GetProperty("hasPassword").GetBoolean());

            var list = await session.Client.GetAsync("/api/savedConnections").ShouldBeAsync(HttpStatusCode.OK);
            Assert.Contains(id, (await list.JsonAsync()).EnumerateArray().Select(item => item.GetProperty("id").GetGuid()));

            await session.Client.GetAsync($"/api/savedConnections/{id}").ShouldBeAsync(HttpStatusCode.OK);

            var changed = await session.Client.PutAsJsonAsync($"/api/savedConnections/{id}", Body("Smoke renamed")).ShouldBeAsync(HttpStatusCode.OK);
            Assert.Equal("Smoke renamed", (await changed.JsonAsync()).GetProperty("name").GetString());

            await session.Client.DeleteAsync($"/api/savedConnections/{id}").ShouldBeAsync(HttpStatusCode.NoContent);
            await session.Client.GetAsync($"/api/savedConnections/{id}").ShouldBeAsync(HttpStatusCode.NotFound);
        }

        [Fact]
        public async Task Names_are_unique_per_user_ignoring_case()
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            using var signedIn = session;
            await session.Client.PostAsJsonAsync("/api/savedConnections", Body("Smoke")).ShouldBeAsync(HttpStatusCode.Created);

            await session.Client.PostAsJsonAsync("/api/savedConnections", Body("SMOKE")).ShouldBeAsync(HttpStatusCode.Conflict);
        }

        [Fact]
        public async Task Another_user_can_use_the_same_name()
        {
            var (userA, _, _) = await _fixture.NewUserAsync();
            var (userB, _, _) = await _fixture.NewUserAsync();
            using var signedInA = userA;
            using var signedInB = userB;

            await userA.Client.PostAsJsonAsync("/api/savedConnections", Body("Shared")).ShouldBeAsync(HttpStatusCode.Created);
            await userB.Client.PostAsJsonAsync("/api/savedConnections", Body("Shared")).ShouldBeAsync(HttpStatusCode.Created);
        }

        [Fact]
        public async Task An_empty_name_is_refused()
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            using var signedIn = session;

            await session.Client.PostAsJsonAsync("/api/savedConnections", Body("")).ShouldBeAsync(HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task A_saved_connection_belongs_to_its_user()
        {
            var (userA, _, _) = await _fixture.NewUserAsync();
            var (userB, _, _) = await _fixture.NewUserAsync();
            using var signedInA = userA;
            using var signedInB = userB;
            var created = await userA.Client.PostAsJsonAsync("/api/savedConnections", Body("Private")).ShouldBeAsync(HttpStatusCode.Created);
            var id = (await created.JsonAsync()).GetProperty("id").GetGuid();

            await userB.Client.GetAsync($"/api/savedConnections/{id}").ShouldBeAsync(HttpStatusCode.NotFound);
        }

        [Fact]
        public async Task A_remembered_password_connects_without_typing_it()
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            using var signedIn = session;

            var created = await session.Client.PostAsJsonAsync("/api/savedConnections", Body("Remembered", rememberPassword: true, password: AppFixture.PgPassword))
                .ShouldBeAsync(HttpStatusCode.Created);
            var createdJson = await created.JsonAsync();
            var id = createdJson.GetProperty("id").GetGuid();

            Assert.True(createdJson.GetProperty("hasPassword").GetBoolean());
            AssertPasswordNotEchoed(createdJson);

            var connected = await session.Client.PostAsJsonAsync("/api/databaseConnection/connect", _fixture.ConnectBody(password: "", savedConnectionId: id))
                .ShouldBeAsync(HttpStatusCode.OK);
            Assert.Equal(id, (await connected.JsonAsync()).GetProperty("savedConnectionId").GetGuid());
        }

        [Fact]
        public async Task A_forgotten_password_no_longer_connects()
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            using var signedIn = session;
            var created = await session.Client.PostAsJsonAsync("/api/savedConnections", Body("Forgotten", rememberPassword: true, password: AppFixture.PgPassword))
                .ShouldBeAsync(HttpStatusCode.Created);
            var id = (await created.JsonAsync()).GetProperty("id").GetGuid();

            await session.Client.DeleteAsync($"/api/savedConnections/{id}/password").ShouldBeAsync(HttpStatusCode.NoContent);

            await session.Client.PostAsJsonAsync("/api/databaseConnection/connect", _fixture.ConnectBody(password: "", savedConnectionId: id))
                .ShouldBeAsync(HttpStatusCode.BadRequest);
        }

        // The sample password is "postgres", the same as the user name and the database name, so a plain text search
        // of the response could not tell an echoed password from those two. Instead: no password field, and no other
        // field holds the password's value.
        private static void AssertPasswordNotEchoed(JsonElement saved)
        {
            foreach (var property in saved.EnumerateObject())
            {
                Assert.NotEqual("password", property.Name, StringComparer.OrdinalIgnoreCase);
                if (property.Name is not ("userName" or "databaseName"))
                {
                    Assert.NotEqual(AppFixture.PgPassword, property.Value.ToString());
                }
            }
        }
    }
}
