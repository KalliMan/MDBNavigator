using MDBNavigator.SharedKernel.Messaging;

namespace MDBNavigator.Connections.Application.SavedConnections.DeleteSavedConnection
{
    public record DeleteSavedConnectionCommand(string UserId, Guid Id) : ICommand;
}
