using MDBNavigator.Accounts.Demo;
using MDBNavigator.Accounts.Identity;
using MDBNavigator.API.Tests.Infrastructure;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Json;

namespace MDBNavigator.API.Tests
{
    [Collection(DemoCollection.Name)]
    public class DemoTests
    {
        private readonly DemoAppFixture _fixture;

        public DemoTests(DemoAppFixture fixture) => _fixture = fixture;

        [Fact]
        public async Task Settings_show_the_demo()
        {
            using var client = _fixture.CreateAnonymousClient();

            var settings = await (await client.GetAsync("/api/auth/settings").ShouldBeAsync(HttpStatusCode.OK)).JsonAsync();

            var demo = settings.GetProperty("demo");
            Assert.Equal(DemoAppFixture.ContactEmail, demo.GetProperty("contactEmail").GetString());
            Assert.Equal(DemoAppFixture.SessionMinutes, demo.GetProperty("sessionMinutes").GetInt32());
            Assert.Equal(DemoAppFixture.ConnectionName, demo.GetProperty("connectionName").GetString());
            // The demo connection's password stays on the server.
            Assert.DoesNotContain(AppFixture.PgPassword, settings.GetRawText());
        }

        [Fact]
        public async Task A_wrong_invite_code_is_refused()
        {
            var email = DemoAppFixture.NewEmail();

            var response = await _fixture.JoinAsync("Smoke Visitor", email, inviteCode: "not-the-code").ShouldBeAsync(HttpStatusCode.Forbidden);

            Assert.Contains("invite link isn't valid", await response.ErrorMessageAsync());
            await CapturedEmails.SettleAsync();
            Assert.Empty(_fixture.Emails.To(email));
        }

        [Fact]
        public async Task The_terms_must_be_agreed_to_in_their_current_version()
        {
            var missing = await _fixture.JoinAsync("Smoke Visitor", DemoAppFixture.NewEmail(), termsVersion: null).ShouldBeAsync(HttpStatusCode.BadRequest);
            var old = await _fixture.JoinAsync("Smoke Visitor", DemoAppFixture.NewEmail(), termsVersion: "2000-01-01").ShouldBeAsync(HttpStatusCode.BadRequest);

            Assert.True((await missing.JsonAsync()).GetProperty("errors").TryGetProperty("TermsNotAccepted", out _));
            Assert.True((await old.JsonAsync()).GetProperty("errors").TryGetProperty("TermsChanged", out _));
        }

        [Fact]
        public async Task An_invited_visitor_gets_a_link_that_starts_a_guest_session()
        {
            var email = DemoAppFixture.NewEmail();
            await _fixture.JoinAsync("Ada Lovelace", email).ShouldBeAsync(HttpStatusCode.NoContent);

            using var guest = await _fixture.StartAsync(await _fixture.LinkTokenAsync(email));

            var me = await (await guest.Client.GetAsync("/api/auth/me").ShouldBeAsync(HttpStatusCode.OK)).JsonAsync();
            var info = me.GetProperty("guest");
            Assert.Equal("Ada Lovelace", info.GetProperty("name").GetString());
            // With its "Z": the browser must read it as UTC.
            Assert.EndsWith("Z", info.GetProperty("endsAtUtc").GetString());
            var endsAt = info.GetProperty("endsAtUtc").GetDateTime().ToUniversalTime();
            var expected = _fixture.Clock.GetUtcNow().UtcDateTime.AddMinutes(DemoAppFixture.SessionMinutes);
            Assert.InRange(endsAt, expected.AddMinutes(-1), expected.AddMinutes(1));
            Assert.InRange(info.GetProperty("secondsLeft").GetInt32(), DemoAppFixture.SessionMinutes * 60 - 60, DemoAppFixture.SessionMinutes * 60);
            Assert.False(me.GetProperty("isAdmin").GetBoolean());

            // The owner hears about a new visitor.
            var notice = await _fixture.Emails.WaitForAsync(DemoAppFixture.OwnerEmail, m => m.TextBody.Contains(email));
            Assert.Contains("Ada Lovelace", notice.TextBody);
        }

        [Fact]
        public async Task A_link_works_once()
        {
            var email = DemoAppFixture.NewEmail();
            await _fixture.JoinAsync("Smoke Visitor", email).ShouldBeAsync(HttpStatusCode.NoContent);
            var token = await _fixture.LinkTokenAsync(email);
            using var first = await _fixture.StartAsync(token);

            var again = await _fixture.PostStartAsync(token).ShouldBeAsync(HttpStatusCode.BadRequest);

            Assert.Contains("expired or was already used", await again.ErrorMessageAsync());
        }

        [Fact]
        public async Task A_visitor_exists_only_once_a_link_was_used()
        {
            var email = DemoAppFixture.NewEmail();
            await _fixture.JoinAsync("Smoke Visitor", email).ShouldBeAsync(HttpStatusCode.NoContent);
            await _fixture.Emails.WaitForAsync(email);

            // The form alone proves nothing about the address, so it isn't a returning visitor yet.
            await _fixture.AskForSignInLinkAsync(email).ShouldBeAsync(HttpStatusCode.NoContent);

            await CapturedEmails.SettleAsync();
            Assert.Single(_fixture.Emails.To(email));
        }

        [Fact]
        public async Task A_returning_visitor_gets_a_new_link()
        {
            var email = DemoAppFixture.NewEmail();
            await _fixture.JoinAsync("Grace Hopper", email).ShouldBeAsync(HttpStatusCode.NoContent);
            using (await _fixture.StartAsync(await _fixture.LinkTokenAsync(email)))
            {
            }

            await _fixture.AskForSignInLinkAsync(email.ToUpperInvariant()).ShouldBeAsync(HttpStatusCode.NoContent);
            using var again = await _fixture.StartAsync(await _fixture.LinkTokenAsync(email, count: 2));

            var me = await (await again.Client.GetAsync("/api/auth/me").ShouldBeAsync(HttpStatusCode.OK)).JsonAsync();
            Assert.Equal("Grace Hopper", me.GetProperty("guest").GetProperty("name").GetString());
        }

        [Fact]
        public async Task An_unknown_address_gets_the_same_answer_and_no_email()
        {
            var email = DemoAppFixture.NewEmail();

            await _fixture.AskForSignInLinkAsync(email).ShouldBeAsync(HttpStatusCode.NoContent);

            await CapturedEmails.SettleAsync();
            Assert.Empty(_fixture.Emails.To(email));
        }

        [Fact]
        public async Task Link_emails_per_address_are_limited()
        {
            var email = DemoAppFixture.NewEmail();

            for (var i = 0; i <= DemoAppFixture.LinkEmailsPerAddressPerHour; i++)
            {
                await _fixture.JoinAsync("Smoke Visitor", email).ShouldBeAsync(HttpStatusCode.NoContent);
            }

            await _fixture.Emails.WaitForAsync(email, DemoAppFixture.LinkEmailsPerAddressPerHour);
            await CapturedEmails.SettleAsync();
            Assert.Equal(DemoAppFixture.LinkEmailsPerAddressPerHour, _fixture.Emails.To(email).Count);
        }

        [Fact]
        public async Task A_visitor_has_a_daily_limit_and_the_refused_link_stays_usable()
        {
            var email = DemoAppFixture.NewEmail();
            await _fixture.JoinAsync("Smoke Visitor", email).ShouldBeAsync(HttpStatusCode.NoContent);
            for (var i = 1; i <= DemoAppFixture.SessionsPerVisitorPerDay; i++)
            {
                if (i > 1)
                {
                    await _fixture.AskForSignInLinkAsync(email).ShouldBeAsync(HttpStatusCode.NoContent);
                }
                using var session = await _fixture.StartAsync(await _fixture.LinkTokenAsync(email, count: i));
            }
            await _fixture.AskForSignInLinkAsync(email).ShouldBeAsync(HttpStatusCode.NoContent);
            var token = await _fixture.LinkTokenAsync(email, count: DemoAppFixture.SessionsPerVisitorPerDay + 1);

            var refused = await _fixture.PostStartAsync(token).ShouldBeAsync(HttpStatusCode.TooManyRequests);
            Assert.Contains($"today's {DemoAppFixture.SessionsPerVisitorPerDay} demo sessions", await refused.ErrorMessageAsync());

            // Not used up: trying again gets the same answer, not "already used".
            await _fixture.PostStartAsync(token).ShouldBeAsync(HttpStatusCode.TooManyRequests);
        }

        [Fact]
        public async Task A_guest_has_no_account_settings()
        {
            using var guest = await _fixture.NewGuestAsync();

            await guest.Client.GetAsync("/api/auth/account").ShouldBeAsync(HttpStatusCode.Forbidden);
            await guest.Client.GetAsync("/api/auth/manage/info").ShouldBeAsync(HttpStatusCode.Forbidden);
            await guest.Client.PostAsJsonAsync("/api/auth/manage/info", new { newEmail = DemoAppFixture.NewEmail() }).ShouldBeAsync(HttpStatusCode.Forbidden);
        }

        [Fact]
        public async Task A_guest_is_connected_to_the_demo_database_by_the_server()
        {
            using var guest = await _fixture.NewGuestAsync();

            var response = await guest.Client.PostAsync("/api/demo/connect", null).ShouldBeAsync(HttpStatusCode.OK);

            var connection = await response.JsonAsync();
            Assert.Equal(DemoAppFixture.ConnectionName, connection.GetProperty("connectionName").GetString());
            var connectionId = connection.GetProperty("connectionId").GetString();
            await guest.Client.GetAsync($"/api/databaseSchema/databases/{connectionId}").ShouldBeAsync(HttpStatusCode.OK);
        }

        [Fact]
        public async Task Only_guests_use_the_demo_connection()
        {
            using var admin = await _fixture.SignInAsAdminAsync();

            await admin.Client.PostAsync("/api/demo/connect", null).ShouldBeAsync(HttpStatusCode.Forbidden);
        }

        [Fact]
        public async Task Logging_out_ends_the_session_and_deletes_the_account_at_once()
        {
            using var guest = await _fixture.NewGuestAsync();
            var guestEmail = await GuestEmailAsync(guest);

            await guest.Client.PostAsync("/api/auth/logout", null).ShouldBeAsync(HttpStatusCode.NoContent);

            // The browser drops the cookie; a copy of it no longer works either.
            await guest.Client.GetAsync("/api/auth/me").ShouldBeAsync(HttpStatusCode.Unauthorized);
            Assert.Null(await FindUserAsync(guestEmail));
        }

        [Fact]
        public async Task A_session_ends_on_time_and_the_clean_up_deletes_the_account()
        {
            using var guest = await _fixture.NewGuestAsync();
            var guestEmail = await GuestEmailAsync(guest);
            await guest.Client.PostAsync("/api/demo/connect", null).ShouldBeAsync(HttpStatusCode.OK);

            _fixture.Clock.Advance(TimeSpan.FromMinutes(DemoAppFixture.SessionMinutes + 1));

            await guest.Client.GetAsync("/api/auth/me").ShouldBeAsync(HttpStatusCode.Unauthorized);
            await guest.Client.GetAsync("/api/savedConnections").ShouldBeAsync(HttpStatusCode.Unauthorized);
            await _fixture.Factory.Services.GetRequiredService<DemoCleanup>().RunAsync(CancellationToken.None);
            Assert.Null(await FindUserAsync(guestEmail));
        }

        private static async Task<string> GuestEmailAsync(ApiSession guest)
            => (await (await guest.Client.GetAsync("/api/auth/me").ShouldBeAsync(HttpStatusCode.OK)).JsonAsync()).GetProperty("email").GetString()!;

        private async Task<ApplicationUser?> FindUserAsync(string email)
        {
            await using var scope = _fixture.Factory.Services.CreateAsyncScope();
            return await scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>().FindByEmailAsync(email);
        }
    }
}
