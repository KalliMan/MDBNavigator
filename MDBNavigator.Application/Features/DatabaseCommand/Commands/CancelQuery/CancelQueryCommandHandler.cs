using MDBNavigator.Application.Contracts;
using MediatR;

namespace MDBNavigator.Application.Features.DatabaseCommand.Commands.CancelQuery
{
    public class CancelQueryCommandHandler : IRequestHandler<CancelQueryCommand, Unit>
    {
        private readonly ICommandExecutionRegistry _registry;

        public CancelQueryCommandHandler(ICommandExecutionRegistry registry)
        {
            _registry = registry;
        }

        // The outcome is reported to the client via the CommandFinished hub message.
        public Task<Unit> Handle(CancelQueryCommand request, CancellationToken cancellationToken)
        {
            _registry.Cancel(request.SessionId, request.ExecutionId);
            return Task.FromResult(Unit.Value);
        }
    }
}
