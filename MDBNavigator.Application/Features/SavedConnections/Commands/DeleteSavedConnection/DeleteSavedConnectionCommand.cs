using MDBNavigator.Application.Messaging;
using MediatR;

namespace MDBNavigator.Application.Features.SavedConnections.Commands.DeleteSavedConnection
{
    public record DeleteSavedConnectionCommand(string UserId, Guid Id) : ICommand<Unit>;
}
