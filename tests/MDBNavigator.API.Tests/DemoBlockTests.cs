using MDBNavigator.API.Tests.Infrastructure;
using System.Net;
using System.Net.Http.Json;

namespace MDBNavigator.API.Tests
{
    // Refused actions in a guest session: enough of them end it and block the visitor's email (roadmap 0.5b2).
    [Collection(DemoBlockCollection.Name)]
    public class DemoBlockTests
    {
        // A write in a read-only transaction: refused by the database with 25006, which counts like a missing privilege.
        // (The tests connect as a superuser, who has every privilege, so 42501 can't be shown here.)
        private const string RefusedWrite = "start transaction read only; create table violation_check(i int)";
        private const string SessionEnded = "This session has ended after too many refused actions.";

        private readonly DemoBlockAppFixture _fixture;

        public DemoBlockTests(DemoBlockAppFixture fixture) => _fixture = fixture;

        [Fact]
        public async Task Refused_actions_end_the_session_and_block_the_visitor()
        {
            var email = DemoAppFixture.NewEmail();
            await _fixture.JoinAsync("Blocked Visitor", email).ShouldBeAsync(HttpStatusCode.NoContent);
            using var guest = await _fixture.StartAsync(await _fixture.LinkTokenAsync(email));
            // A second link, kept for after the block.
            await _fixture.AskForSignInLinkAsync(email).ShouldBeAsync(HttpStatusCode.NoContent);
            var keptToken = await _fixture.LinkTokenAsync(email, 2);

            var connectionId = await DemoConnectAsync(guest);
            await using (var hub = await guest.ListenAsync())
            {
                for (var i = 0; i < DemoBlockAppFixture.ViolationsBeforeBlock - 1; i++)
                {
                    var run = await guest.RunAsync(connectionId, RefusedWrite, hub);
                    Assert.Equal("Failed", run.Finished.GetProperty("status").GetString());
                    Assert.Contains("25006", run.Finished.GetProperty("error").GetString());
                }
            }
            await guest.Client.GetAsync("/api/auth/me").ShouldBeAsync(HttpStatusCode.OK);

            // The last one is a refused connection.
            await guest.Client.PostAsJsonAsync("/api/databaseConnection/connect", _fixture.ConnectBody(password: "wrong"))
                .ShouldBeAsync(HttpStatusCode.BadRequest);

            await guest.Client.GetAsync("/api/auth/me").ShouldBeAsync(HttpStatusCode.Unauthorized);
            var ownerEmail = await _fixture.Emails.WaitForAsync(DemoAppFixture.OwnerEmail,
                m => m.Subject == "MDBNavigator demo visitor blocked" && m.TextBody.Contains(email));
            Assert.Contains("was blocked from the demo for 24 hours after 3 refused actions", ownerEmail.TextBody);
            Assert.Contains("2 permission errors, 1 refused connections, 0 limits reached", ownerEmail.TextBody);

            // Blocked: the kept link doesn't start a session, and a new link isn't sent (same answer as always).
            var refused = await _fixture.PostStartAsync(keptToken).ShouldBeAsync(HttpStatusCode.Forbidden);
            Assert.Contains("paused for 24 hours", await refused.Content.ReadAsStringAsync());
            await _fixture.AskForSignInLinkAsync(email).ShouldBeAsync(HttpStatusCode.NoContent);
            await CapturedEmails.SettleAsync();
            Assert.Equal(2, _fixture.Emails.To(email).Count);

            // Once the block is over, the visitor is welcome again.
            _fixture.Clock.Advance(TimeSpan.FromHours(DemoBlockAppFixture.BlockHours + 1));
            await _fixture.AskForSignInLinkAsync(email).ShouldBeAsync(HttpStatusCode.NoContent);
            using var again = await _fixture.StartAsync(await _fixture.LinkTokenAsync(email, 3));
            await again.Client.GetAsync("/api/auth/me").ShouldBeAsync(HttpStatusCode.OK);
        }

        [Fact]
        public async Task The_run_that_ends_the_session_says_so()
        {
            using var guest = await _fixture.NewGuestAsync();
            var connectionId = await DemoConnectAsync(guest);
            await using var hub = await guest.ListenAsync();

            for (var i = 1; i <= DemoBlockAppFixture.ViolationsBeforeBlock; i++)
            {
                var run = await guest.RunAsync(connectionId, RefusedWrite, hub);
                var error = run.Finished.GetProperty("error").GetString();
                if (i < DemoBlockAppFixture.ViolationsBeforeBlock)
                {
                    Assert.DoesNotContain(SessionEnded, error);
                }
                else
                {
                    Assert.EndsWith(SessionEnded, error);
                }
            }
            await guest.Client.GetAsync("/api/auth/me").ShouldBeAsync(HttpStatusCode.Unauthorized);
        }

        [Fact]
        public async Task Mistakes_are_not_counted()
        {
            using var guest = await _fixture.NewGuestAsync();
            var connectionId = await DemoConnectAsync(guest);
            await using var hub = await guest.ListenAsync();

            for (var i = 0; i <= DemoBlockAppFixture.ViolationsBeforeBlock; i++)
            {
                var run = await guest.RunAsync(connectionId, "select * from no_such_table", hub);
                Assert.Equal("Failed", run.Finished.GetProperty("status").GetString());
            }
            await guest.Client.GetAsync("/api/auth/me").ShouldBeAsync(HttpStatusCode.OK);
        }

        [Fact]
        public async Task Refused_actions_of_other_users_are_not_counted()
        {
            // The admin: with email on, a new account would first have to confirm its email. No other test here uses it.
            using (var user = await _fixture.SignInAsAdminAsync())
            {
                for (var i = 0; i <= DemoBlockAppFixture.ViolationsBeforeBlock; i++)
                {
                    var response = await user.Client.PostAsJsonAsync("/api/databaseConnection/connect", _fixture.ConnectBody(password: "wrong"));
                    Assert.NotEqual(HttpStatusCode.OK, response.StatusCode);
                }
                await user.Client.GetAsync("/api/auth/me").ShouldBeAsync(HttpStatusCode.OK);
            }
        }

        private static async Task<string> DemoConnectAsync(ApiSession guest)
        {
            var response = await guest.Client.PostAsync("/api/demo/connect", null).ShouldBeAsync(HttpStatusCode.OK);
            return (await response.JsonAsync()).GetProperty("connectionId").GetString()!;
        }
    }
}
