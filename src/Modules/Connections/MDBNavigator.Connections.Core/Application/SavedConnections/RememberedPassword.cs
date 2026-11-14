using MDBNavigator.Connections.Domain;
using MDBNavigator.Providers.Abstractions;

namespace MDBNavigator.Connections.Application.SavedConnections
{
    // The rules for using and keeping a remembered password, shared by the saved-connection handlers and connect/reconnect.
    public static class RememberedPassword
    {
        public const string NotEnabledMessage = "Remembering passwords is not turned on for this server.";
        // The connect validator's wording, so the user sees one message whichever check caught it.
        public const string RequiredMessage = "Password is required.";

        // The remembered password belongs to one server and login. Used on connect (only then is it sent) and on update
        // (an edit to any of these forgets it). Otherwise a stolen session could point a saved entry at its own server
        // and have us send it the password. Host names ignore case, as DNS does. User names don't: PostgreSQL's are
        // case-sensitive. The database is not part of it: same server, same login.
        public static bool SameTarget(SavedConnection saved, ServerType serverType, string serverName, int port, string userName)
            => saved.ServerType == serverType
               && string.Equals(saved.ServerName, serverName.Trim(), StringComparison.OrdinalIgnoreCase)
               && saved.Port == port
               && string.Equals(saved.UserName, userName.Trim(), StringComparison.Ordinal);
    }
}
