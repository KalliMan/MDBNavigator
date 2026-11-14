namespace MDBNavigator.Connections.Infrastructure
{
    public class SavedConnectionOptions
    {
        public const string SectionName = "SavedConnections";

        // 32 random bytes in base64, e.g. from `openssl rand -base64 32`. A secret: user secrets or an environment
        // variable (SavedConnections__PasswordKey), never appsettings.json. Not set: passwords aren't remembered.
        public string? PasswordKey { get; set; }

        // Null when not set (empty counts as not set). Throws at startup for a key that can't be right, rather than
        // failing at the first saved password.
        public static byte[]? ParseKey(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }
            byte[] key;
            try
            {
                key = Convert.FromBase64String(value.Trim());
            }
            catch (FormatException)
            {
                throw new InvalidOperationException(KeyMessage);
            }
            return key.Length == 32 ? key : throw new InvalidOperationException(KeyMessage);
        }

        private const string KeyMessage =
            "SavedConnections:PasswordKey must be 32 random bytes in base64 (44 characters), for example from `openssl rand -base64 32`.";
    }
}
