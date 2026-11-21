using MDBNavigator.API.Tests.Infrastructure;
using System.Net;
using System.Net.Http.Json;

namespace MDBNavigator.API.Tests
{
    [Collection(ClosedSignUpCollection.Name)]
    public class ClosedSignUpTests
    {
        private readonly ClosedSignUpAppFixture _fixture;

        public ClosedSignUpTests(ClosedSignUpAppFixture fixture) => _fixture = fixture;

        [Fact]
        public async Task Settings_say_sign_up_is_closed()
        {
            using var client = _fixture.CreateAnonymousClient();

            var response = await client.GetAsync("/api/auth/settings").ShouldBeAsync(HttpStatusCode.OK);

            Assert.Equal("Closed", (await response.JsonAsync()).GetProperty("signUp").GetString());
        }

        [Fact]
        public async Task Register_is_refused()
        {
            using var client = _fixture.CreateAnonymousClient();

            var response = await client.PostAsJsonAsync("/api/auth/register", new { email = $"user-{Guid.NewGuid():N}@example.test", password = AppFixture.UserPassword })
                .ShouldBeAsync(HttpStatusCode.Forbidden);

            Assert.Contains("Creating accounts is switched off", await response.Content.ReadAsStringAsync());
        }

        [Fact]
        public async Task The_admin_can_still_sign_in()
        {
            using var session = await _fixture.SignInAsAdminAsync();

            await session.Client.GetAsync("/api/auth/me").ShouldBeAsync(HttpStatusCode.OK);
        }
    }
}
