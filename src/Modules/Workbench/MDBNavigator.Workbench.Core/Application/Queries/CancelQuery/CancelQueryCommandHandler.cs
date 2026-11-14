using MDBNavigator.SharedKernel.Messaging;

namespace MDBNavigator.Workbench.Application.Queries.CancelQuery
{
    public class CancelQueryCommandHandler : ICommandHandler<CancelQueryCommand>
    {
        private readonly ICommandExecutionRegistry _registry;

        public CancelQueryCommandHandler(ICommandExecutionRegistry registry)
        {
            _registry = registry;
        }

        // The outcome is reported to the client via the CommandFinished hub message.
        public Task Handle(CancelQueryCommand request, CancellationToken cancellationToken)
        {
            _registry.Cancel(request.SessionId, request.ExecutionId);
            return Task.CompletedTask;
        }
    }
}
