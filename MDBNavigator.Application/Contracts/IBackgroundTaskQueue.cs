namespace MDBNavigator.Application.Contracts
{
    // A queued task runs outside the request. It receives the services of its own DI scope, which the
    // background worker creates and disposes around it.
    public interface IBackgroundTaskQueue
    {
        void EnqueueTask(Func<IServiceProvider, CancellationToken, Task> task);

        // Blocks until a task is available.
        Task<Func<IServiceProvider, CancellationToken, Task>> DequeueAsync(CancellationToken cancellationToken);
    }
}
