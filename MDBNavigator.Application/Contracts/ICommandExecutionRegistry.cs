namespace MDBNavigator.Application.Contracts
{
    // Tracks running streamed queries (by execution id, unique per run) so they can be cancelled
    // by the user or when their connection is disconnected.
    public interface ICommandExecutionRegistry
    {
        // Null when the user (all their browser tabs) already has maxPerUser runs registered; 0 means no limit.
        // A run counts from here until Complete, so runs still waiting for a worker count too.
        CancellationTokenSource? TryRegister(string sessionId, string connectionId, string executionId, int maxPerUser);

        void Cancel(string sessionId, string executionId);

        void CancelAllForConnection(string sessionId, string connectionId);

        // Every running query of the user, in all their browser tabs. Returns how many were cancelled.
        int CancelAllForUser(string userId);

        // Removes the run if it is still the registered one, then disposes its token source.
        void Complete(string sessionId, string executionId, CancellationTokenSource cts);
    }
}
