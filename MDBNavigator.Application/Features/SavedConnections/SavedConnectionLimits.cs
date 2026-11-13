namespace MDBNavigator.Application.Features.SavedConnections
{
    // Limits for saved connections, shared by the validator and the EF mapping (column lengths).
    public static class SavedConnectionLimits
    {
        // Caps what one account can store on a public instance.
        public const int MaxPerUser = 100;

        public const int NameMaxLength = 100;
        // The longest DNS name.
        public const int ServerNameMaxLength = 253;
        // PostgreSQL identifiers are at most 63 bytes, SQL Server's 128 characters: 128 covers both.
        public const int DatabaseNameMaxLength = 128;
        public const int UserNameMaxLength = 128;
        // Generous for a database password; caps what one row can make the server encrypt and store.
        public const int PasswordMaxLength = 1024;
    }
}
