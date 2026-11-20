namespace MDBNavigator.SharedKernel.Violations
{
    public enum ViolationKind
    {
        // The database refused a statement for lack of rights (a write in the read-only demo, a function the role may
        // not run), or a guest called an endpoint guests are kept out of.
        PermissionDenied,
        // A connect or reconnect failed, or the connection guard refused the host.
        ConnectionRefused,
        // A limit stopped the request or the run (time, rows, rate, running queries, the database's own limits).
        LimitReached
    }

    // Something this server refused a signed-in user. Only the public demo counts them (Accounts, DemoViolations):
    // enough of them end a guest's session and block the visitor. Without the demo nothing implements this, so callers
    // take it as an optional constructor parameter. Mistakes (a syntax error, a missing table) are not violations.
    public interface IViolationRecorder
    {
        // userId: the account (SessionKey.UserIdOf). True when this violation ended the user's session, so the caller
        // can say so. Never throws, and a block it starts isn't cancelled by the caller going away.
        Task<bool> RecordAsync(string userId, ViolationKind kind);
    }
}
