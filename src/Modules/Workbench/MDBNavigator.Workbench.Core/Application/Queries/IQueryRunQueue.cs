using MDBNavigator.Workbench.Application.Queries.RunQuery;

namespace MDBNavigator.Workbench.Application.Queries
{
    // A run that waits for a worker: what to run, and the handle that cancels it (already in the registry).
    public sealed record QueuedQueryRun(RunQueryCommand Command, CancellationTokenSource Cancellation);

    public interface IQueryRunQueue
    {
        void Enqueue(QueuedQueryRun run);

        // Waits until a run is available.
        Task<QueuedQueryRun> DequeueAsync(CancellationToken cancellationToken);
    }
}
