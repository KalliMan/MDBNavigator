using MDBNavigator.Application.Contracts;
using System.Collections.Concurrent;

namespace MDBNavigator.Infrastructure.BackgroundQueue
{
    public class CommandExecutionRegistry : ICommandExecutionRegistry
    {
        private sealed record Execution(string SessionId, string ConnectionId, CancellationTokenSource Cts);

        private readonly ConcurrentDictionary<string, Execution> _executions = new();

        private static string GetKey(string sessionId, string executionId) => $"{sessionId}_{executionId}";

        public CancellationTokenSource Register(string sessionId, string connectionId, string executionId)
        {
            var execution = new Execution(sessionId, connectionId, new CancellationTokenSource());
            var key = GetKey(sessionId, executionId);

            _executions.AddOrUpdate(key, execution, (_, previous) =>
            {
                TryCancel(previous.Cts);
                return execution;
            });

            return execution.Cts;
        }

        public void Cancel(string sessionId, string executionId)
        {
            if (_executions.TryGetValue(GetKey(sessionId, executionId), out var execution))
            {
                TryCancel(execution.Cts);
            }
        }

        public void CancelAllForConnection(string sessionId, string connectionId)
        {
            foreach (var execution in _executions.Values)
            {
                if (execution.SessionId == sessionId && execution.ConnectionId == connectionId)
                {
                    TryCancel(execution.Cts);
                }
            }
        }

        public void Complete(string sessionId, string executionId, CancellationTokenSource cts)
        {
            var key = GetKey(sessionId, executionId);
            if (_executions.TryGetValue(key, out var execution) && execution.Cts == cts)
            {
                _executions.TryRemove(new KeyValuePair<string, Execution>(key, execution));
            }
            cts.Dispose();
        }

        private static void TryCancel(CancellationTokenSource cts)
        {
            try
            {
                cts.Cancel();
            }
            catch (ObjectDisposedException)
            {
                // The execution finished between lookup and cancel.
            }
        }
    }
}
