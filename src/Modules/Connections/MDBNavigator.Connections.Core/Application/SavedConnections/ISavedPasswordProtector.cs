namespace MDBNavigator.Connections.Application.SavedConnections
{
    // Encrypts the passwords that saved connections remember (SavedConnections:PasswordKey). Each value is bound to
    // its row: the same bytes in another row, or under another owner, don't decrypt.
    public interface ISavedPasswordProtector
    {
        // False when SavedConnections:PasswordKey isn't set: passwords are then neither stored nor used.
        bool Enabled { get; }

        // Throws InvalidOperationException when not Enabled (callers check Enabled first).
        byte[] Protect(string password, Guid savedConnectionId, string ownerId);

        // True when the value was written with the current key, so Unprotect can be expected to work. Doesn't decrypt,
        // so listing saved connections never decrypts anything.
        bool IsCurrent(byte[] protectedPassword);

        // Null when not Enabled, written with another key, or changed or damaged (the tag doesn't match). Never throws
        // for a bad value.
        string? Unprotect(byte[] protectedPassword, Guid savedConnectionId, string ownerId);
    }
}
