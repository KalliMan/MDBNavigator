using MDBNavigator.Application.Messaging;
using MediatR;

namespace MDBNavigator.Application.Features.DatabaseCommand.Commands.CancelQuery
{
    public record CancelQueryCommand(string SessionId, string ExecutionId) : ICommand<Unit>;
}
