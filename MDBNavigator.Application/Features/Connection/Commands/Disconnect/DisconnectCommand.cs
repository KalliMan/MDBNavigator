using MDBNavigator.Application.Messaging;
using MediatR;

namespace MDBNavigator.Application.Features.Connection.Commands.Disconnect
{
    public record DisconnectCommand(string SessionId, string ConnectionId) : ICommand<Unit>;
}
