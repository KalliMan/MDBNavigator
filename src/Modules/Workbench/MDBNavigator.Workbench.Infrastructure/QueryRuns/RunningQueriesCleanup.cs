using MDBNavigator.Connections.Contracts;
using MDBNavigator.SharedKernel.UserData;
using MDBNavigator.Workbench.Application.Queries;
using Microsoft.Extensions.Logging;

namespace MDBNavigator.Workbench.Infrastructure.QueryRuns
{
    // Stops the queries that can no longer deliver: those of a connection the user closed, and those of a deleted account.
    public class RunningQueriesCleanup : IConnectionClosedListener, IUserDataEraser
    {
        private readonly ICommandExecutionRegistry _registry;
        private readonly ILogger<RunningQueriesCleanup> _logger;

        public RunningQueriesCleanup(ICommandExecutionRegistry registry, ILogger<RunningQueriesCleanup> logger)
        {
            _registry = registry;
            _logger = logger;
        }

        public void ConnectionClosed(string sessionId, string connectionId)
            => _registry.CancelAllForConnection(sessionId, connectionId);

        public Task EraseAsync(string userId, CancellationToken cancellationToken)
        {
            var cancelled = _registry.CancelAllForUser(userId);

            // No user id or email in the log: it's personal data.
            _logger.LogInformation("Cancelled {Cancelled} running queries of a deleted account", cancelled);
            return Task.CompletedTask;
        }
    }
}
