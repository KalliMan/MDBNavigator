using MDBNavigator.SharedKernel.Messaging;

namespace MDBNavigator.Workbench.Application.Queries.CancelQuery
{
    public record CancelQueryCommand(string SessionId, string ExecutionId) : ICommand;
}
