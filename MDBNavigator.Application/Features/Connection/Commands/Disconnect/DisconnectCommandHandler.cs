using MDBNavigator.Application.Contracts;
using MediatR;

namespace MDBNavigator.Application.Features.Connection.Commands.Disconnect
{
    public class DisconnectCommandHandler : IRequestHandler<DisconnectCommand, Unit>
    {
        private readonly IConnectionCache _connectionCache;
        private readonly ICommandExecutionRegistry _registry;

        public DisconnectCommandHandler(IConnectionCache connectionCache, ICommandExecutionRegistry registry)
        {
            _connectionCache = connectionCache;
            _registry = registry;
        }

        public Task<Unit> Handle(DisconnectCommand request, CancellationToken cancellationToken)
        {
            _registry.CancelAllForConnection(request.SessionId, request.ConnectionId);

            var cacheKey = DbConnectionHelper.GetCacheKey(request.SessionId, request.ConnectionId);
            _connectionCache.Remove(cacheKey);
            return Task.FromResult(Unit.Value);
        }
    }
}
