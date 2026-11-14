using MDBNavigator.SharedKernel.Errors;
using MDBNavigator.SharedKernel.Messaging;

namespace MDBNavigator.Workbench.Application.Queries.RunQuery
{
    public record RunQueryCommand(string SessionId, string ConnectionId, string ExecutionId, string DatabaseName, string CmdQuery)
        : ICommand<CommandAcknowledgedDto>;

    public class RunQueryCommandHandler : ICommandHandler<RunQueryCommand, CommandAcknowledgedDto>
    {
        private readonly IQueryRunQueue _queue;
        private readonly ICommandExecutionRegistry _registry;
        private readonly QueryLimitOptions _limits;

        public RunQueryCommandHandler(IQueryRunQueue queue, ICommandExecutionRegistry registry, QueryLimitOptions limits)
        {
            _queue = queue;
            _registry = registry;
            _limits = limits;
        }

        public Task<CommandAcknowledgedDto> Handle(RunQueryCommand request, CancellationToken cancellationToken)
        {
            // Registered before enqueueing so the run can be cancelled while it still waits for a worker.
            var maxRunning = _limits.MaxRunningQueriesPerUser;
            var executionCts = _registry.TryRegister(request.SessionId, request.ConnectionId, request.ExecutionId, maxRunning)
                ?? throw new TooManyRequestsException(
                    $"You already have {(maxRunning == 1 ? "a query" : $"{maxRunning} queries")} running. Wait for one to finish, or cancel one, then try again.");

            _queue.Enqueue(new QueuedQueryRun(request, executionCts));

            return Task.FromResult(new CommandAcknowledgedDto { Id = request.ExecutionId });
        }
    }
}
