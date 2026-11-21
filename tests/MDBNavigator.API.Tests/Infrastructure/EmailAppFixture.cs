using MDBNavigator.Accounts.Email;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.DependencyInjection;
using System.Text.RegularExpressions;

namespace MDBNavigator.API.Tests.Infrastructure
{
    [CollectionDefinition(Name)]
    public sealed class EmailCollection : ICollectionFixture<EmailAppFixture>
    {
        public const string Name = "API with email";
    }

    // An app that sends email (caught, not sent): accounts need a confirmed email to sign in with a password, and
    // passwords can be reset. A collection of its own: in the main app NewUserAsync signs in right after registering.
    public sealed class EmailAppFixture : AppFixture
    {
        public const string AppBaseUrl = "https://app.example.test";

        public CapturedEmails Emails { get; } = new();

        public EmailAppFixture() : base(new Dictionary<string, string>
        {
            ["Email:Delivery"] = "Smtp",
            ["Email:Smtp:Host"] = "smtp.invalid",
            ["Email:FromAddress"] = "sender@example.test",
            ["Email:AppBaseUrl"] = AppBaseUrl,
        })
        {
        }

        protected override void ConfigureServices(IServiceCollection services) => services.AddSingleton<IEmailDelivery>(Emails);

        public static string NewEmail() => $"user-{Guid.NewGuid():N}@example.test";

        // The query string values of the first link in the email that starts with AppBaseUrl/path.
        public static Dictionary<string, string> LinkQuery(EmailMessage message, string path)
        {
            var match = Regex.Match(message.TextBody, Regex.Escape($"{AppBaseUrl}/{path}?") + @"(\S*)");
            Assert.True(match.Success, $"No {path} link in the email: {message.TextBody}");

            // ParseQuery decodes the values.
            return QueryHelpers.ParseQuery("?" + match.Groups[1].Value).ToDictionary(pair => pair.Key, pair => pair.Value.ToString());
        }
    }
}
