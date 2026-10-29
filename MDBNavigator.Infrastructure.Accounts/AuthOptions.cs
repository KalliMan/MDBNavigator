namespace MDBNavigator.Infrastructure.Accounts
{
    public enum AuthMode
    {
        // Sign-in required; accounts are stored in the app database.
        Accounts,
        // No sign-in and no app database; the API serves only requests from the local machine.
        None
    }

    public enum SignUpMode
    {
        Open,
        Closed
    }

    public class AuthOptions
    {
        public const string SectionName = "Auth";

        public AuthMode Mode { get; set; } = AuthMode.Accounts;

        // Closed: nobody can create an account through the UI or the API; the admin comes from Admin below.
        public SignUpMode SignUp { get; set; } = SignUpMode.Open;

        public AdminAccountOptions Admin { get; set; } = new();
    }

    // The first admin, created at startup when Email is set and the account doesn't exist yet.
    // Set both values in user secrets or environment variables, not in appsettings.json.
    public class AdminAccountOptions
    {
        public string? Email { get; set; }
        public string? Password { get; set; }
    }
}
