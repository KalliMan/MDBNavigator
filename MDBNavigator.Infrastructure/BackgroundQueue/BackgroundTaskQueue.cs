using MDBNavigator.Application.Contracts;
using Microsoft.Extensions.DependencyInjection;
using System.Collections.Concurrent;

namespace MDBNavigator.Infrastructure.BackgroundQueue
{
    public class BackgroundTaskQueue : IBackgroundTaskQueue
    {
        private readonly ConcurrentQueue<Func<IServiceScopeFactory, CancellationToken, Task>> _items = new();
        private readonly SemaphoreSlim _signal = new SemaphoreSlim(0);

        public void EnqueueTask(Func<IServiceScopeFactory, CancellationToken, Task> task)
        {
            ArgumentNullException.ThrowIfNull(task);
            _items.Enqueue(task);
            _signal.Release();
        }

        public async Task<Func<IServiceScopeFactory, CancellationToken, Task>> DequeueAsync(CancellationToken cancellationToken)
        {
            await _signal.WaitAsync(cancellationToken);
            _items.TryDequeue(out var task);
            return task!;
        }
    }
}
