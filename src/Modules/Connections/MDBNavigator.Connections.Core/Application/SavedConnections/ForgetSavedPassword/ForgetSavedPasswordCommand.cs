using MDBNavigator.SharedKernel.Messaging;

namespace MDBNavigator.Connections.Application.SavedConnections.ForgetSavedPassword
{
    // Forgets a saved connection's remembered password; the entry stays. Works with or without the key, so a password
    // can always be removed.
    public record ForgetSavedPasswordCommand(string UserId, Guid Id) : ICommand;
}
