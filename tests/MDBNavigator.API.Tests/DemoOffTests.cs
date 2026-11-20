using MDBNavigator.API.Tests.Infrastructure;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace MDBNavigator.API.Tests
{
    // The demo is off unless configured: none of its endpoints exist.
    [Collection(ApiCollection.Name)]
    public class DemoOffTests
    {
        private readonly AppFixture _fixture;

        public DemoOffTests(AppFixture fixture) => _fixture = fixture;

        [Fact]
        public async Task Settings_have_no_demo()
        {
            using var client = _fixture.CreateAnonymousClient();

            var settings = await (await client.GetAsync("/api/auth/settings").ShouldBeAsync(HttpStatusCode.OK)).JsonAsync();

            Assert.Equal(JsonValueKind.Null, settings.GetProperty("demo").ValueKind);
        }

        [Fact]
        public async Task The_demo_endpoints_are_not_there()
        {
            using var client = _fixture.CreateAnonymousClient();
            using var signedIn = await _fixture.SignInAsAdminAsync();

            await client.PostAsJsonAsync("/api/demo/join", new { inviteCode = "x", name = "x", email = "x@example.test", termsVersion = "x" })
                .ShouldBeAsync(HttpStatusCode.NotFound);
            await client.PostAsJsonAsync("/api/demo/start", new { token = "x" }).ShouldBeAsync(HttpStatusCode.NotFound);
            await signedIn.Client.PostAsync("/api/demo/connect", null).ShouldBeAsync(HttpStatusCode.NotFound);
        }
    }
}
