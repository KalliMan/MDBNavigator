using MDBNavigator.Connections.Contracts;
using MDBNavigator.SharedKernel.Messaging;

namespace MDBNavigator.Connections.Application.Disconnect
{
    public class DisconnectCommandHandler : ICommandHandler<DisconnectCommand>
    {
        private readonly IConnectionCache _connectionCache;
        private readonly IEnumerable<IConnectionClosedListener> _listeners;

        public DisconnectCommandHandler(IConnectionCache connectionCache, IEnumerable<IConnectionClosedListener> listeners)
        {
            _connectionCache = connectionCache;
            _listeners = listeners;
        }

        public Task Handle(DisconnectCommand request, CancellationToken cancellationToken)
        {
            // Whatever still runs on the connection (queries) stops first, then the connection itself is forgotten.
            foreach (var listener in _listeners)
            {
                listener.ConnectionClosed(request.SessionId, request.ConnectionId);
            }

            _connectionCache.Remove(request.SessionId, request.ConnectionId);
            return Task.CompletedTask;
        }
    }
}
