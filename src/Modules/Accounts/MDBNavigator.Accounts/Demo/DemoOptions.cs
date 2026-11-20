using MDBNavigator.Accounts.Email;
using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;
using System.Text;

namespace MDBNavigator.Accounts.Demo
{
    // The "Demo" section: invited guests try the app in short sessions, connected to a sample database.
    // Off unless Enabled; then every value below must make sense, or the app doesn't start.
    public class DemoOptions
    {
        public const string SectionName = "Demo";
        public const int InviteCodeMinLength = 16;

        public bool Enabled { get; set; }

        // The secrets in invite links (/?code=...), each with a name that says where the link was shared. Changing or
        // blanking one stops only its links. Secrets: user secrets or the environment variables
        // Demo__InviteCodes__0__Name, Demo__InviteCodes__0__Code, ..., not appsettings.json.
        public List<DemoInviteCode> InviteCodes { get; set; } = [];

        // Replaced by InviteCodes; only read to stop startup with a clear message when an old configuration still sets it,
        // so it can't silently lose its code.
        public string InviteCode { get; set; } = string.Empty;

        // Gets an email for every new visitor and every block.
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

        // Refused actions in one guest session (DemoViolations) before it ends and the visitor's email is blocked.
        public int ViolationsBeforeBlock { get; set; } = 20;

        // How long a blocked visitor can't start sessions or get links.
        public int BlockHours { get; set; } = 24;

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
            ValidateInviteCodes(problems);
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
                || LinkRequestsPerIpPerHour < 1 || LinkValidMinutes < 1 || ViolationsBeforeBlock < 1)
            {
                problems.Add("the Demo limits must be at least 1");
            }
            if (BlockHours is < 1 or > 168)
            {
                problems.Add("Demo:BlockHours must be between 1 and 168");
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

        private void ValidateInviteCodes(List<string> problems)
        {
            if (InviteCode.Length > 0)
            {
                problems.Add("Demo:InviteCode is replaced by Demo:InviteCodes (a list of Name and Code)");
            }
            var codes = InviteCodes.Where(c => c.Code.Length > 0).ToList();
            if (codes.Count == 0)
            {
                problems.Add("Demo:InviteCodes needs at least one code");
            }
            if (InviteCodes.Any(c => !DemoInviteCode.IsValidName(c.Name)))
            {
                problems.Add($"Demo:InviteCodes names must be 1-{DemoInviteCode.NameMaxLength} letters, digits, spaces, - or _");
            }
            if (InviteCodes.Select(c => c.Name.ToLowerInvariant()).Distinct().Count() < InviteCodes.Count)
            {
                problems.Add("Demo:InviteCodes names must be unique");
            }
            if (codes.Any(c => c.Code.Length < InviteCodeMinLength))
            {
                problems.Add($"Demo:InviteCodes codes must have at least {InviteCodeMinLength} characters");
            }
            if (codes.Select(c => c.Code).Distinct().Count() < codes.Count)
            {
                problems.Add("Demo:InviteCodes codes must be unique");
            }
        }

        // The code's entry, or null. Compares with every entry in constant time and doesn't stop at a match, so the
        // answer's timing gives away neither the code nor which entry matched. A switched-off entry (empty Code) never
        // matches, whatever is given.
        public DemoInviteCode? FindInviteCode(string? given)
        {
            var givenBytes = Encoding.UTF8.GetBytes(given ?? string.Empty);
            DemoInviteCode? found = null;
            foreach (var entry in InviteCodes)
            {
                var same = CryptographicOperations.FixedTimeEquals(givenBytes, Encoding.UTF8.GetBytes(entry.Code));
                if (same && entry.Code.Length > 0 && given is not null)
                {
                    found ??= entry;
                }
            }
            return found;
        }

        public static bool IsEmail(string? value)
            => !string.IsNullOrWhiteSpace(value) && value.Length <= 256 && new EmailAddressAttribute().IsValid(value);
    }

    // One invite link's secret, with a name that says where the link was shared (LinkedIn, CV, ...). The name is the
    // owner's own label: it is stored with each visitor and may be logged.
    public class DemoInviteCode
    {
        public const int NameMaxLength = 30;

        public string Name { get; set; } = string.Empty;
        // Empty: switched off, its links don't work.
        public string Code { get; set; } = string.Empty;

        public static bool IsValidName(string name)
            => name.Length is >= 1 and <= NameMaxLength && name.All(c => char.IsAsciiLetterOrDigit(c) || c is ' ' or '-' or '_');
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
