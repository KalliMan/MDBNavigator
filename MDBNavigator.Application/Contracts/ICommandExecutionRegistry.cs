namespace MDBNavigator.Application.Contracts
{
    // Tracks running streamed queries (by execution id, unique per run) so they can be cancelled
    // by the user or when their connection is disconnected.
    public interface ICommandExecutionRegistry
    {
        CancellationTokenSource Register(string sessionId, string connectionId, string executionId);

        void Cancel(string sessionId, string executionId);

        void CancelAllForConnection(string sessionId, string connectionId);

        // Removes the run if it is still the registered one, then disposes its token source.
        void Complete(string sessionId, string executionId, CancellationTokenSource cts);
    }
}
