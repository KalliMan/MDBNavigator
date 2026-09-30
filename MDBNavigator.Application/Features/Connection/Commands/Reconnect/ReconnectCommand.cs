using MDBNavigator.Application.DTOs;
using MDBNavigator.Application.Messaging;
using MDBNavigator.Domain.ValueObjects;

namespace MDBNavigator.Application.Features.Connection.Commands.Reconnect
{
    public record ReconnectCommand(string SessionId, string ConnectionId, ConnectionSettings ConnectionSettings)
        : ICommand<ConnectedResultDto>;
}
