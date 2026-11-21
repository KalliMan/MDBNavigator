using MDBNavigator.API.Tests.Infrastructure;
using System.Net;
using System.Net.Http.Json;

namespace MDBNavigator.API.Tests
{
    // Email confirmation and password reset, in an app that sends email (caught by the fixture).
    [Collection(EmailCollection.Name)]
    public class EmailFlowTests
    {
        private const string Password = AppFixture.UserPassword;

        private readonly EmailAppFixture _fixture;

        public EmailFlowTests(EmailAppFixture fixture) => _fixture = fixture;

        private async Task RegisterAsync(HttpClient client, string email)
        {
            await client.PostAsJsonAsync("/api/auth/register", new { email, password = Password }).ShouldBeAsync(HttpStatusCode.OK);
        }

        private Task<HttpResponseMessage> LoginAsync(HttpClient client, string email, string password)
            => client.PostAsJsonAsync("/api/auth/login?useCookies=true", new { email, password });

        // Opens the link of the (first) confirmation email.
        private async Task ConfirmAsync(HttpClient client, string email)
        {
            var link = EmailAppFixture.LinkQuery(await _fixture.Emails.WaitForAsync(email), "confirm-email");
            await client.GetAsync($"/api/auth/confirmEmail?userId={Uri.EscapeDataString(link["userId"])}&code={Uri.EscapeDataString(link["code"])}")
                .ShouldBeAsync(HttpStatusCode.OK);
        }

        [Fact]
        public async Task Settings_say_email_is_on()
        {
            using var client = _fixture.CreateAnonymousClient();

            var response = await client.GetAsync("/api/auth/settings").ShouldBeAsync(HttpStatusCode.OK);

            Assert.True((await response.JsonAsync()).GetProperty("emailEnabled").GetBoolean());
        }

        [Fact]
        public async Task Sign_in_waits_for_the_confirmed_email()
        {
            var email = EmailAppFixture.NewEmail();
            using var client = _fixture.CreateAnonymousClient();

            await RegisterAsync(client, email);
            await LoginAsync(client, email, Password).ShouldBeAsync(HttpStatusCode.Unauthorized);

            await ConfirmAsync(client, email);

            using var session = await _fixture.SignInAsync(email, Password);
            var me = await (await session.Client.GetAsync("/api/auth/me").ShouldBeAsync(HttpStatusCode.OK)).JsonAsync();
            Assert.Equal(email, me.GetProperty("email").GetString());
        }

        [Fact]
        public async Task A_wrong_confirmation_code_is_refused()
        {
            var email = EmailAppFixture.NewEmail();
            using var client = _fixture.CreateAnonymousClient();
            await RegisterAsync(client, email);
            var link = EmailAppFixture.LinkQuery(await _fixture.Emails.WaitForAsync(email), "confirm-email");

            await client.GetAsync($"/api/auth/confirmEmail?userId={Uri.EscapeDataString(link["userId"])}&code=wrong")
                .ShouldBeAsync(HttpStatusCode.Unauthorized);

            // The account is still unconfirmed.
            await LoginAsync(client, email, Password).ShouldBeAsync(HttpStatusCode.Unauthorized);
        }

        [Fact]
        public async Task The_password_can_be_reset()
        {
            var email = EmailAppFixture.NewEmail();
            const string newPassword = "a-new-smoke-password";
            using var client = _fixture.CreateAnonymousClient();
            await RegisterAsync(client, email);
            await ConfirmAsync(client, email);

            await client.PostAsJsonAsync("/api/auth/forgotPassword", new { email }).ShouldBeAsync(HttpStatusCode.OK);
            var link = EmailAppFixture.LinkQuery(await _fixture.Emails.WaitForAsync(email, 2), "reset-password");
            await client.PostAsJsonAsync("/api/auth/resetPassword", new { email, resetCode = link["code"], newPassword })
                .ShouldBeAsync(HttpStatusCode.OK);

            await LoginAsync(client, email, Password).ShouldBeAsync(HttpStatusCode.Unauthorized);
            await LoginAsync(client, email, newPassword).ShouldBeAsync(HttpStatusCode.OK);
        }

        [Fact]
        public async Task Forgot_password_for_an_unknown_email_sends_nothing()
        {
            var email = EmailAppFixture.NewEmail();
            using var client = _fixture.CreateAnonymousClient();

            // The same answer as for a real address, so the form doesn't tell which accounts exist.
            await client.PostAsJsonAsync("/api/auth/forgotPassword", new { email }).ShouldBeAsync(HttpStatusCode.OK);

            await CapturedEmails.SettleAsync();
            Assert.Empty(_fixture.Emails.To(email));
        }

        [Fact]
        public async Task A_wrong_reset_code_is_refused()
        {
            var email = EmailAppFixture.NewEmail();
            using var client = _fixture.CreateAnonymousClient();
            await RegisterAsync(client, email);
            await ConfirmAsync(client, email);

            await client.PostAsJsonAsync("/api/auth/resetPassword", new { email, resetCode = "wrong", newPassword = "a-new-smoke-password" })
                .ShouldBeAsync(HttpStatusCode.BadRequest);

            await LoginAsync(client, email, Password).ShouldBeAsync(HttpStatusCode.OK);
        }
    }
}
