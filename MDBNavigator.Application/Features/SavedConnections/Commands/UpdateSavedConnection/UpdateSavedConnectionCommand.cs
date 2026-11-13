using MDBNavigator.Application.DTOs;
using MDBNavigator.Application.Messaging;

namespace MDBNavigator.Application.Features.SavedConnections.Commands.UpdateSavedConnection
{
    public record UpdateSavedConnectionCommand(string UserId, Guid Id, SavedConnectionInput Input) : ICommand<SavedConnectionDto>;
}
