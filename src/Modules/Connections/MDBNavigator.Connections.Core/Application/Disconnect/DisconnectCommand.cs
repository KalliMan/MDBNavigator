using MDBNavigator.SharedKernel.Messaging;

namespace MDBNavigator.Connections.Application.Disconnect
{
    public record DisconnectCommand(string SessionId, string ConnectionId) : ICommand;
}
