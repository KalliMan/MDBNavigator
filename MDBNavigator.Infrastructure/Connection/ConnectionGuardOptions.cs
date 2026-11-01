namespace MDBNavigator.Infrastructure.Connection
{
    public enum ConnectionGuardMode
    {
        // Public addresses only, plus the Allow entries. For instances where strangers can sign up: the server's
        // own network (localhost, private ranges) is not theirs to reach.
        Public,
        // Only the Allow entries.
        AllowList,
        // Any address. For self-hosted installs whose users are trusted.
        Off
    }

    public class ConnectionGuardOptions
    {
        public const string SectionName = "ConnectionGuard";

        // When not set, Program.cs derives it from Auth: Public with open sign-up, Off otherwise.
        public ConnectionGuardMode? Mode { get; set; }

        // Host names (matched against what the user typed), IP addresses or ranges such as 10.20.0.0/16.
        public List<string> Allow { get; set; } = [];
    }
}
