using MDBNavigator.Application.Common;
using MDBNavigator.Application.Contracts;
using System.Collections.Concurrent;

namespace MDBNavigator.Infrastructure.BackgroundQueue
{
    public class CommandExecutionRegistry : ICommandExecutionRegistry
    {
        private sealed record Execution(string SessionId, string ConnectionId, CancellationTokenSource Cts);

        private readonly ConcurrentDictionary<string, Execution> _executions = new();
        // Makes counting a user's runs and adding one a single step, so two requests at once can't both get the
        // last free place. Only registering takes it; removing a run can only lower the count.
        private readonly Lock _registerLock = new();

        private static string GetKey(string sessionId, string executionId) => $"{sessionId}_{executionId}";

        public CancellationTokenSource? TryRegister(string sessionId, string connectionId, string executionId, int maxPerUser)
        {
            var key = GetKey(sessionId, executionId);
            var prefix = SessionKey.UserPrefix(SessionKey.UserIdOf(sessionId));

            lock (_registerLock)
            {
                // A run registered again under the same id replaces the old one, so the old one doesn't count.
                if (maxPerUser > 0
                    && _executions.Count(e => e.Key != key && e.Value.SessionId.StartsWith(prefix, StringComparison.Ordinal)) >= maxPerUser)
                {
                    return null;
                }

                var execution = new Execution(sessionId, connectionId, new CancellationTokenSource());
                _executions.AddOrUpdate(key, execution, (_, previous) =>
                {
                    TryCancel(previous.Cts);
                    return execution;
                });

                return execution.Cts;
            }
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

        public int CancelAllForUser(string userId)
        {
            var prefix = SessionKey.UserPrefix(userId);
            var cancelled = 0;
            foreach (var execution in _executions.Values)
            {
                if (execution.SessionId.StartsWith(prefix, StringComparison.Ordinal))
                {
                    TryCancel(execution.Cts);
                    cancelled++;
                }
            }
            return cancelled;
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
