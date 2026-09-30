namespace MDBNavigator.BL.BackgroundTaskQueue
{
    public interface IBackgroundTaskQueue
    {
        void EnqueueTask(Func<CancellationToken, Task> task);

        // Dequeues and returns one task. This method blocks until a task becomes available.
        Task<Func<CancellationToken, Task>> DequeueAsync(CancellationToken cancellationToken);
    }
}
