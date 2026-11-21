using MDBNavigator.API.Tests.Infrastructure;
using System.Net;
using System.Net.Http.Json;

namespace MDBNavigator.API.Tests
{
    [Collection(ApiCollection.Name)]
    public class AuthTests
    {
        private readonly AppFixture _fixture;

        public AuthTests(AppFixture fixture) => _fixture = fixture;

        [Fact]
        public async Task Settings_are_public()
        {
            using var client = _fixture.CreateAnonymousClient();

            var response = await client.GetAsync("/api/auth/settings").ShouldBeAsync(HttpStatusCode.OK);

            var settings = await response.JsonAsync();
            Assert.Equal("Accounts", settings.GetProperty("mode").GetString());
            Assert.Equal("Open", settings.GetProperty("signUp").GetString());
            Assert.False(settings.GetProperty("emailEnabled").GetBoolean());
            Assert.Equal("None", settings.GetProperty("captchaProvider").GetString());
            Assert.True(settings.GetProperty("rememberPasswords").GetBoolean());
        }

        [Fact]
        public async Task The_api_requires_sign_in()
        {
            using var client = _fixture.CreateAnonymousClient();
            client.DefaultRequestHeaders.Add("id", Guid.NewGuid().ToString());

            await client.GetAsync("/api/savedConnections").ShouldBeAsync(HttpStatusCode.Unauthorized);
        }

        [Fact]
        public async Task The_seeded_admin_can_sign_in()
        {
            using var session = await _fixture.SignInAsAdminAsync();

            var response = await session.Client.GetAsync("/api/auth/me").ShouldBeAsync(HttpStatusCode.OK);

            var me = await response.JsonAsync();
            Assert.Equal(ApiFactory.AdminEmail, me.GetProperty("email").GetString());
            Assert.True(me.GetProperty("isAdmin").GetBoolean());
            Assert.Equal("Password", me.GetProperty("signInMethod").GetString());
        }

        [Fact]
        public async Task A_wrong_password_is_refused()
        {
            using var client = _fixture.CreateAnonymousClient();

            await client.PostAsJsonAsync("/api/auth/login?useCookies=true", new { email = ApiFactory.AdminEmail, password = "not-the-password" })
                .ShouldBeAsync(HttpStatusCode.Unauthorized);
        }

        [Fact]
        public async Task A_new_account_can_register_and_sign_in()
        {
            var (session, email, _) = await _fixture.NewUserAsync();
            using var signedIn = session;

            var response = await session.Client.GetAsync("/api/auth/me").ShouldBeAsync(HttpStatusCode.OK);

            var me = await response.JsonAsync();
            Assert.Equal(email, me.GetProperty("email").GetString());
            Assert.False(me.GetProperty("isAdmin").GetBoolean());
        }

        [Fact]
        public async Task A_short_password_is_refused()
        {
            using var client = _fixture.CreateAnonymousClient();

            await client.PostAsJsonAsync("/api/auth/register", new { email = $"user-{Guid.NewGuid():N}@example.test", password = "short" })
                .ShouldBeAsync(HttpStatusCode.BadRequest);
        }

        // Lockout.MaxFailedAccessAttempts is 5 (AccountsModule). A new account, never the admin: the admin is shared by
        // the other tests, and the lockout lasts minutes.
        [Fact]
        public async Task Five_wrong_passwords_lock_the_account()
        {
            var (session, email, password) = await _fixture.NewUserAsync();
            session.Dispose();
            using var client = _fixture.CreateAnonymousClient();

            for (var attempt = 0; attempt < 5; attempt++)
            {
                await client.PostAsJsonAsync("/api/auth/login?useCookies=true", new { email, password = "not-the-password" })
                    .ShouldBeAsync(HttpStatusCode.Unauthorized);
            }

            // The right password no longer works: that is the lockout.
            await client.PostAsJsonAsync("/api/auth/login?useCookies=true", new { email, password })
                .ShouldBeAsync(HttpStatusCode.Unauthorized);
        }

        [Fact]
        public async Task A_request_without_a_tab_id_is_refused()
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            using var signedIn = session;
            using var client = _fixture.CreateAnonymousClient();
            client.DefaultRequestHeaders.Add("Cookie", session.Cookie);

            await client.GetAsync("/api/savedConnections").ShouldBeAsync(HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task Sign_out_answers_without_a_session()
        {
            using var client = _fixture.CreateAnonymousClient();

            await client.PostAsync("/api/auth/logout", content: null).ShouldBeAsync(HttpStatusCode.NoContent);
        }
    }
}
