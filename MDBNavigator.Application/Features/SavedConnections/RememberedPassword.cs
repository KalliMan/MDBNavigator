using FluentValidation;
using MDBNavigator.Application.Contracts;
using MDBNavigator.Domain.Entities;
using MDBNavigator.Domain.Enums;
using MDBNavigator.Domain.Exceptions;
using MDBNavigator.Domain.ValueObjects;

namespace MDBNavigator.Application.Features.SavedConnections
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

        // The settings to connect with, and the saved connection whose remembered password they use (null: the request's
        // own password). A typed password always wins; the id is then not even looked up.
        // Throws ObjectNotFoundException (404) for an id the user doesn't own, and ValidationException (400, RequiredMessage)
        // when there is nothing usable: no key, no password, another key, a changed value, or another server or user.
        public static async Task<(ConnectionSettings Settings, Guid? UsedSavedConnectionId)> ResolveAsync(
            ISavedConnectionStore store, ISavedPasswordProtector passwords, string userId,
            ConnectionSettings settings, Guid? savedConnectionId, CancellationToken cancellationToken)
        {
            if (savedConnectionId is not { } id || !string.IsNullOrEmpty(settings.Password))
            {
                return (settings, null);
            }

            var saved = await store.FindAsync(userId, id, cancellationToken)
                ?? throw new ObjectNotFoundException("Saved connection not found.");

            var password = passwords.Enabled
                           && saved.ProtectedPassword is { } protectedPassword
                           && SameTarget(saved, settings.ServerType, settings.ServerName, settings.Port, settings.UserName)
                ? passwords.Unprotect(protectedPassword, saved.Id, saved.OwnerId)
                : null;
            if (password is null)
            {
                throw new ValidationException(RequiredMessage);
            }

            // The saved entry's own (trimmed) server and user name: they are what the password was remembered for.
            return (settings with { ServerName = saved.ServerName, UserName = saved.UserName, Password = password }, saved.Id);
        }
    }
}
