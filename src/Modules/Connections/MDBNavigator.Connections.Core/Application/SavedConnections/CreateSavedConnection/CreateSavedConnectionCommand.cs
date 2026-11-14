using MDBNavigator.SharedKernel.Messaging;

namespace MDBNavigator.Connections.Application.SavedConnections.CreateSavedConnection
{
    public record CreateSavedConnectionCommand(string UserId, SavedConnectionInput Input) : ICommand<SavedConnectionDto>;
}
