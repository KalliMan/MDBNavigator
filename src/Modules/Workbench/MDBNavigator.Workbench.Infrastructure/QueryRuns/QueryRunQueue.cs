using MDBNavigator.Workbench.Application.Queries;
using System.Threading.Channels;

namespace MDBNavigator.Workbench.Infrastructure.QueryRuns
{
    public class QueryRunQueue : IQueryRunQueue
    {
        private readonly Channel<QueuedQueryRun> _channel =
            Channel.CreateUnbounded<QueuedQueryRun>(new UnboundedChannelOptions { SingleReader = false });

        public void Enqueue(QueuedQueryRun run)
        {
            ArgumentNullException.ThrowIfNull(run);
            _channel.Writer.TryWrite(run);
        }

        public async Task<QueuedQueryRun> DequeueAsync(CancellationToken cancellationToken)
            => await _channel.Reader.ReadAsync(cancellationToken);
    }
}
