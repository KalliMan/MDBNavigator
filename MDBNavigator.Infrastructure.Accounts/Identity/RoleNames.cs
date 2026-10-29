namespace MDBNavigator.Infrastructure.Accounts.Identity
{
    public static class RoleNames
    {
        public const string Admin = "Admin";

        // Created at startup if missing.
        public static readonly IReadOnlyList<string> All = [Admin];
    }
}
