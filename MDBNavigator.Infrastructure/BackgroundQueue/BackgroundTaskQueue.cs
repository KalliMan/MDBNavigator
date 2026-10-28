using MDBNavigator.Application.Contracts;
using Microsoft.Extensions.DependencyInjection;
using System.Threading.Channels;

namespace MDBNavigator.Infrastructure.BackgroundQueue
{
    public class BackgroundTaskQueue : IBackgroundTaskQueue
    {
        private readonly Channel<Func<IServiceScopeFactory, CancellationToken, Task>> _channel =
            Channel.CreateUnbounded<Func<IServiceScopeFactory, CancellationToken, Task>>(new UnboundedChannelOptions { SingleReader = false });

        public void EnqueueTask(Func<IServiceScopeFactory, CancellationToken, Task> task)
        {
            ArgumentNullException.ThrowIfNull(task);
            _channel.Writer.TryWrite(task);
        }

        public async Task<Func<IServiceScopeFactory, CancellationToken, Task>> DequeueAsync(CancellationToken cancellationToken)
            => await _channel.Reader.ReadAsync(cancellationToken);
    }
}
