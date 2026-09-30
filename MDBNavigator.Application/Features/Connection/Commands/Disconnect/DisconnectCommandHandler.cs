using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.Features.Connection.Commands.Connect;
using MediatR;

namespace MDBNavigator.Application.Features.Connection.Commands.Disconnect
{
    public class DisconnectCommandHandler : IRequestHandler<DisconnectCommand, Unit>
    {
        private readonly IConnectionCache _connectionCache;

        public DisconnectCommandHandler(IConnectionCache connectionCache)
        {
            _connectionCache = connectionCache;
        }

        public Task<Unit> Handle(DisconnectCommand request, CancellationToken cancellationToken)
        {
            var cacheKey = ConnectCommandHandler.GetCacheKey(request.SessionId, request.ConnectionId);
            _connectionCache.Remove(cacheKey);
            return Task.FromResult(Unit.Value);
        }
    }
}
