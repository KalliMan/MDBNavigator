using Microsoft.Extensions.DependencyInjection;

namespace MDBNavigator.Application.Contracts
{
    public interface IBackgroundTaskQueue
    {
        void EnqueueTask(Func<IServiceScopeFactory, CancellationToken, Task> task);

        // Blocks until a task is available.
        Task<Func<IServiceScopeFactory, CancellationToken, Task>> DequeueAsync(CancellationToken cancellationToken);
    }
}
