using MDBNavigator.Application.Contracts;
using System.Threading.Channels;

namespace MDBNavigator.Infrastructure.BackgroundQueue
{
    public class BackgroundTaskQueue : IBackgroundTaskQueue
    {
        private readonly Channel<Func<IServiceProvider, CancellationToken, Task>> _channel =
            Channel.CreateUnbounded<Func<IServiceProvider, CancellationToken, Task>>(new UnboundedChannelOptions { SingleReader = false });

        public void EnqueueTask(Func<IServiceProvider, CancellationToken, Task> task)
        {
            ArgumentNullException.ThrowIfNull(task);
            _channel.Writer.TryWrite(task);
        }

        public async Task<Func<IServiceProvider, CancellationToken, Task>> DequeueAsync(CancellationToken cancellationToken)
            => await _channel.Reader.ReadAsync(cancellationToken);
    }
}
