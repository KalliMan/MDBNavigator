using MDBNavigator.Application.DTOs;
using MDBNavigator.Application.Messaging;

namespace MDBNavigator.Application.Features.SavedConnections.Commands.CreateSavedConnection
{
    public record CreateSavedConnectionCommand(string UserId, SavedConnectionInput Input) : ICommand<SavedConnectionDto>;
}
