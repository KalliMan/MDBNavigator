using MDBNavigator.Application.Contracts;
using MediatR;

namespace MDBNavigator.Application.Features
{
    // A request that runs against one of the session's connections (optionally a specific database).
    public interface IConnectionRequest
    {
        string SessionId { get; }
        string ConnectionId { get; }
        string? DatabaseName { get; }
    }

    // Base for handlers that need a database provider: it opens the provider for the request's connection
    // (throws NotConnectedException if the session has no such connection) and disposes it afterwards.
    public abstract class ConnectionRequestHandler<TRequest, TResponse> : IRequestHandler<TRequest, TResponse>
        where TRequest : IRequest<TResponse>, IConnectionRequest
    {
        private readonly IConnectionCache _cache;
        private readonly IDatabaseProviderFactory _factory;

        protected ConnectionRequestHandler(IConnectionCache cache, IDatabaseProviderFactory factory)
        {
            _cache = cache;
            _factory = factory;
        }

        public async Task<TResponse> Handle(TRequest request, CancellationToken cancellationToken)
        {
            await using var provider = await DbConnectionHelper.CreateProviderAsync(
                _cache, _factory, request.SessionId, request.ConnectionId, request.DatabaseName, cancellationToken);
            return await Handle(request, provider, cancellationToken);
        }

        protected abstract Task<TResponse> Handle(TRequest request, IDatabaseProvider provider, CancellationToken cancellationToken);
    }
}
