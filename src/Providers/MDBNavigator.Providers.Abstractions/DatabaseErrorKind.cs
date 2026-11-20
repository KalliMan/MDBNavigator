namespace MDBNavigator.Providers.Abstractions
{
    // Why a database refused a statement, in terms every provider can map to (IDatabaseErrorDescriber.Classify).
    public enum DatabaseErrorKind
    {
        // A mistake in the SQL, a missing object, a constraint...: nothing the server refused on purpose.
        Other,
        // Not allowed for this login: missing privileges, or a write in a read-only transaction.
        PermissionDenied,
        // A limit of the database stopped it: statement timeout, temporary file size, connections per role.
        LimitReached
    }
}
