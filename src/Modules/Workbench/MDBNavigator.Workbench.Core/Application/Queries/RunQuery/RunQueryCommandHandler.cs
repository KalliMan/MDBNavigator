using MDBNavigator.SharedKernel;
using MDBNavigator.SharedKernel.Errors;
using MDBNavigator.SharedKernel.Messaging;
using MDBNavigator.SharedKernel.Violations;

namespace MDBNavigator.Workbench.Application.Queries.RunQuery
{
    public record RunQueryCommand(string SessionId, string ConnectionId, string ExecutionId, string DatabaseName, string CmdQuery,
        QueryPlanMode Plan = QueryPlanMode.None)
        : ICommand<CommandAcknowledgedDto>;

    public class RunQueryCommandHandler : ICommandHandler<RunQueryCommand, CommandAcknowledgedDto>
    {
        private readonly IQueryRunQueue _queue;
        private readonly ICommandExecutionRegistry _registry;
        private readonly QueryLimitOptions _limits;
        // Only in the public demo, which counts refused actions against a guest.
        private readonly IViolationRecorder? _violations;

        public RunQueryCommandHandler(IQueryRunQueue queue, ICommandExecutionRegistry registry, QueryLimitOptions limits,
            IViolationRecorder? violations = null)
        {
            _queue = queue;
            _registry = registry;
            _limits = limits;
            _violations = violations;
        }

        public async Task<CommandAcknowledgedDto> Handle(RunQueryCommand request, CancellationToken cancellationToken)
        {
            // Registered before enqueueing so the run can be cancelled while it still waits for a worker.
            var maxRunning = _limits.MaxRunningQueriesPerUser;
            var executionCts = _registry.TryRegister(request.SessionId, request.ConnectionId, request.ExecutionId, maxRunning);
            if (executionCts is null)
            {
                if (_violations is not null)
                {
                    await _violations.RecordAsync(SessionKey.UserIdOf(request.SessionId), ViolationKind.LimitReached);
                }
                throw new TooManyRequestsException(
                    $"You already have {(maxRunning == 1 ? "a query" : $"{maxRunning} queries")} running. Wait for one to finish, or cancel one, then try again.");
            }

            _queue.Enqueue(new QueuedQueryRun(request, executionCts));

            return new CommandAcknowledgedDto { Id = request.ExecutionId };
        }
    }
}
