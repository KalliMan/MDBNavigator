using MDBNavigator.API.Tests.Infrastructure;
using System.Net;
using System.Net.Http.Json;

namespace MDBNavigator.API.Tests
{
    [Collection(ApiCollection.Name)]
    public class ConnectionTests
    {
        private readonly AppFixture _fixture;

        public ConnectionTests(AppFixture fixture) => _fixture = fixture;

        [Fact]
        public async Task Connect_returns_the_connection()
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            using var signedIn = session;

            var response = await session.Client.PostAsJsonAsync("/api/databaseConnection/connect", _fixture.ConnectBody())
                .ShouldBeAsync(HttpStatusCode.OK);

            var connection = await response.JsonAsync();
            Assert.False(string.IsNullOrEmpty(connection.GetProperty("connectionId").GetString()));
            Assert.Equal("PostgreSQL", connection.GetProperty("serverType").GetString());
            Assert.Equal("postgres", connection.GetProperty("databaseName").GetString());
            Assert.Equal(_fixture.PgPort, connection.GetProperty("port").GetInt32());
        }

        [Fact]
        public async Task A_wrong_password_fails_the_connect()
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            using var signedIn = session;

            var response = await session.Client.PostAsJsonAsync("/api/databaseConnection/connect", _fixture.ConnectBody(password: "wrong"))
                .ShouldBeAsync(HttpStatusCode.BadRequest);

            Assert.StartsWith("Connection failed", await response.ErrorMessageAsync());
        }

        [Fact]
        public async Task An_unknown_server_type_is_refused()
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            using var signedIn = session;

            await session.Client.PostAsJsonAsync("/api/databaseConnection/connect", _fixture.ConnectBody(serverType: "Oracle"))
                .ShouldBeAsync(HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task Reconnect_keeps_the_connection_id()
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            using var signedIn = session;
            var connectionId = await session.ConnectAsync();

            var response = await session.Client.PostAsJsonAsync($"/api/databaseConnection/reconnect/{connectionId}", _fixture.ConnectBody())
                .ShouldBeAsync(HttpStatusCode.OK);

            Assert.Equal(connectionId, (await response.JsonAsync()).GetProperty("connectionId").GetString());
        }

        [Fact]
        public async Task Disconnect_forgets_the_connection()
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            using var signedIn = session;
            var connectionId = await session.ConnectAsync();

            await session.Client.PostAsync($"/api/databaseConnection/disconnect/{connectionId}", content: null).ShouldBeAsync(HttpStatusCode.OK);

            var response = await session.Client.GetAsync($"/api/databaseSchema/tables/{connectionId}?database=postgres")
                .ShouldBeAsync(HttpStatusCode.BadRequest);
            Assert.Contains("Not Connected", await response.ErrorMessageAsync());
        }

        [Fact]
        public async Task A_connection_belongs_to_its_user()
        {
            var (userA, _, _) = await _fixture.NewUserAsync();
            var (userB, _, _) = await _fixture.NewUserAsync();
            using var signedInA = userA;
            using var signedInB = userB;
            var connectionId = await userA.ConnectAsync();

            var response = await userB.Client.GetAsync($"/api/databaseSchema/databases/{connectionId}")
                .ShouldBeAsync(HttpStatusCode.BadRequest);

            Assert.Contains("Not Connected", await response.ErrorMessageAsync());
        }

        [Fact]
        public async Task A_connection_belongs_to_its_tab()
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            using var signedIn = session;
            using var otherTab = session.WithNewTab();
            var connectionId = await session.ConnectAsync();

            var response = await otherTab.Client.GetAsync($"/api/databaseSchema/databases/{connectionId}")
                .ShouldBeAsync(HttpStatusCode.BadRequest);

            Assert.Contains("Not Connected", await response.ErrorMessageAsync());
        }
    }
}
