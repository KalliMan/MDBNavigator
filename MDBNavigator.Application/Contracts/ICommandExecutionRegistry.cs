namespace MDBNavigator.Application.Contracts
{
    // Tracks running streamed queries so they can be cancelled by the user or on disconnect.
    public interface ICommandExecutionRegistry
    {
        // Registers a new run; cancels a previous run of the same command if it is still active.
        CancellationTokenSource Register(string sessionId, string connectionId, string commandId);

        void Cancel(string sessionId, string commandId);

        void CancelAllForConnection(string sessionId, string connectionId);

        // Removes the run only if it is still the registered one, then disposes its token source.
        void Complete(string sessionId, string commandId, CancellationTokenSource cts);
    }
}
