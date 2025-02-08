using Microsoft.Extensions.DependencyInjection;

namespace MDBNavigator.BL.BackgroundTaskQueue
{
    public interface IBackgroundTaskQueue
    {
        void EnqueueTask(Func<IServiceScopeFactory, CancellationToken, Task> task);

        // Dequeues and returns one task. This method blocks until a task becomes available.
        Task<Func<IServiceScopeFactory, CancellationToken, Task>> DequeueAsync(CancellationToken cancellationToken);
    }
}
