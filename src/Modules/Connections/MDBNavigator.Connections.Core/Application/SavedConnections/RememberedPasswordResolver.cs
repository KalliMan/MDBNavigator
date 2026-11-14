using FluentValidation;
using MDBNavigator.Providers.Abstractions;
using MDBNavigator.SharedKernel.Errors;

namespace MDBNavigator.Connections.Application.SavedConnections
{
    // The settings to connect with, and the saved connection whose remembered password they use (null: the request's
    // own password). A typed password always wins; the id is then not even looked up.
    // Throws ObjectNotFoundException (404) for an id the user doesn't own, and ValidationException (400, RequiredMessage)
    // when there is nothing usable: no key, no password, another key, a changed value, or another server or user.
    public class RememberedPasswordResolver
    {
        private readonly ISavedConnectionStore _store;
        private readonly ISavedPasswordProtector _passwords;

        public RememberedPasswordResolver(ISavedConnectionStore store, ISavedPasswordProtector passwords)
        {
            _store = store;
            _passwords = passwords;
        }

        public async Task<(ConnectionSettings Settings, Guid? UsedSavedConnectionId)> ResolveAsync(
            string userId, ConnectionSettings settings, Guid? savedConnectionId, CancellationToken cancellationToken)
        {
            if (savedConnectionId is not { } id || !string.IsNullOrEmpty(settings.Password))
            {
                return (settings, null);
            }

            var saved = await _store.FindAsync(userId, id, cancellationToken)
                ?? throw new ObjectNotFoundException("Saved connection not found.");

            var password = _passwords.Enabled
                           && saved.ProtectedPassword is { } protectedPassword
                           && RememberedPassword.SameTarget(saved, settings.ServerType, settings.ServerName, settings.Port, settings.UserName)
                ? _passwords.Unprotect(protectedPassword, saved.Id, saved.OwnerId)
                : null;
            if (password is null)
            {
                throw new ValidationException(RememberedPassword.RequiredMessage);
            }

            // The saved entry's own (trimmed) server and user name: they are what the password was remembered for.
            return (settings with { ServerName = saved.ServerName, UserName = saved.UserName, Password = password }, saved.Id);
        }
    }
}
