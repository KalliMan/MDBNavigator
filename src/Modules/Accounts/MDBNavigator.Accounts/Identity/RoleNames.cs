namespace MDBNavigator.Accounts.Identity
{
    public static class RoleNames
    {
        public const string Admin = "Admin";

        // A throwaway account for one demo session (Demo/DemoAccess.cs), deleted when the session ends.
        public const string Guest = "Guest";

        // Created at startup if missing.
        public static readonly IReadOnlyList<string> All = [Admin, Guest];
    }
}
