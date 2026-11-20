using MDBNavigator.Accounts.Email;
using System.ComponentModel.DataAnnotations;

namespace MDBNavigator.Accounts.Demo
{
    // The "Demo" section: invited guests try the app in short sessions, connected to a sample database.
    // Off unless Enabled; then every value below must make sense, or the app doesn't start.
    public class DemoOptions
    {
        public const string SectionName = "Demo";
        public const int InviteCodeMinLength = 16;

        public bool Enabled { get; set; }

        // The secret in invite links (/demo?code=...). Changing it stops every link sent so far. A secret: user secrets
        // or the environment variable Demo__InviteCode, not appsettings.json.
        public string InviteCode { get; set; } = string.Empty;

        // Gets an email for every new visitor.
        public string OwnerEmail { get; set; } = string.Empty;

        // Shown in the demo terms, for visitors who want their data deleted sooner.
        public string ContactEmail { get; set; } = string.Empty;

        public int SessionMinutes { get; set; } = 10;

        // Over the last 24 hours.
        public int SessionsPerVisitorPerDay { get; set; } = 3;

        public int MaxActiveGuests { get; set; } = 10;

        // Sessions started from one IP address within an hour. Only starts that worked count.
        public int SessionsPerIpPerHour { get; set; } = 3;

        // Above this, no further link is emailed to the address within the hour, so nobody can flood someone else's
        // inbox through this server. The answer stays the same.
        public int LinkEmailsPerAddressPerHour { get; set; } = 3;

        // Link requests (new and returning visitors) from one IP address within an hour.
        public int LinkRequestsPerIpPerHour { get; set; } = 10;

        public int LinkValidMinutes { get; set; } = 30;

        public DemoConnectionOptions Connection { get; set; } = new();

        // Fails at startup rather than when the first visitor arrives.
        internal void Validate(EmailOptions email)
        {
            if (!Enabled)
            {
                return;
            }

            // Auth:Mode = Accounts is checked by the API: without it, this isn't called.
            var problems = new List<string>();
            if (!email.Enabled)
            {
                problems.Add("Email:Delivery must be set (the links are sent by email)");
            }
            if (InviteCode.Length < InviteCodeMinLength)
            {
                problems.Add($"Demo:InviteCode must have at least {InviteCodeMinLength} characters");
            }
            if (!IsEmail(OwnerEmail))
            {
                problems.Add("Demo:OwnerEmail must be an email address");
            }
            if (!IsEmail(ContactEmail))
            {
                problems.Add("Demo:ContactEmail must be an email address");
            }
            if (SessionMinutes is < 1 or > 120)
            {
                problems.Add("Demo:SessionMinutes must be between 1 and 120");
            }
            if (SessionsPerVisitorPerDay < 1 || MaxActiveGuests < 1 || SessionsPerIpPerHour < 1 || LinkEmailsPerAddressPerHour < 1
                || LinkRequestsPerIpPerHour < 1 || LinkValidMinutes < 1)
            {
                problems.Add("the Demo limits must be at least 1");
            }
            if (string.IsNullOrWhiteSpace(Connection.ServerName) || Connection.Port < 1 || string.IsNullOrWhiteSpace(Connection.UserName)
                || string.IsNullOrEmpty(Connection.Password) || string.IsNullOrWhiteSpace(Connection.DatabaseName))
            {
                problems.Add("Demo:Connection needs ServerName, Port, UserName, Password and DatabaseName");
            }

            if (problems.Count > 0)
            {
                throw new InvalidOperationException($"Demo:Enabled is true, but {string.Join("; ", problems)}.");
            }
        }

        public static bool IsEmail(string? value)
            => !string.IsNullOrWhiteSpace(value) && value.Length <= 256 && new EmailAddressAttribute().IsValid(value);
    }

    // The sample database guests are connected to. The server connects them itself, so the password never reaches the
    // browser and a guest can't point the connection elsewhere.
    // PostgreSQL only.
    public class DemoConnectionOptions
    {
        // The connection's name in the UI.
        public string Name { get; set; } = "Sample database";
        public string ServerName { get; set; } = string.Empty;
        public int Port { get; set; } = 5432;
        public string UserName { get; set; } = string.Empty;
        // Environment variable Demo__Connection__Password.
        public string Password { get; set; } = string.Empty;
        public string DatabaseName { get; set; } = string.Empty;
    }
}
