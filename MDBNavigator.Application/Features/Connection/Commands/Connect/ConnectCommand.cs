using MDBNavigator.Application.DTOs;
using MDBNavigator.Application.Messaging;
using MDBNavigator.Domain.ValueObjects;

namespace MDBNavigator.Application.Features.Connection.Commands.Connect
{
    public record ConnectCommand(string SessionId, ConnectionSettings ConnectionSettings)
        : ICommand<ConnectedResultDto>;
}
