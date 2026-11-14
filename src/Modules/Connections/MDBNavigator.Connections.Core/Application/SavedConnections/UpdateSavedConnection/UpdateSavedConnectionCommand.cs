using MDBNavigator.SharedKernel.Messaging;

namespace MDBNavigator.Connections.Application.SavedConnections.UpdateSavedConnection
{
    public record UpdateSavedConnectionCommand(string UserId, Guid Id, SavedConnectionInput Input) : ICommand<SavedConnectionDto>;
}
