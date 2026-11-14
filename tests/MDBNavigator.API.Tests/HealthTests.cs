using MDBNavigator.API.Tests.Infrastructure;
using System.Net;

namespace MDBNavigator.API.Tests
{
    [Collection(ApiCollection.Name)]
    public class HealthTests
    {
        private readonly AppFixture _fixture;

        public HealthTests(AppFixture fixture) => _fixture = fixture;

        [Fact]
        public async Task Health_answers_without_sign_in()
        {
            using var client = _fixture.CreateAnonymousClient();

            var response = await client.GetAsync("/health").ShouldBeAsync(HttpStatusCode.OK);

            Assert.Equal("Healthy", await response.Content.ReadAsStringAsync());
        }
    }
}
