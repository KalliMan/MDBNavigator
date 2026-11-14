using MDBNavigator.Connections.Contracts;
using MDBNavigator.Providers.Abstractions;
using MDBNavigator.SharedKernel.Messaging;

namespace MDBNavigator.Workbench.Application
{
    // A request that runs against one of the session's connections (optionally a specific database).
    public interface IConnectionRequest
    {
        string SessionId { get; }
        string ConnectionId { get; }
        string? DatabaseName { get; }
    }

    // Base for handlers that need an open database: it opens a client for the request's connection
    // (throws NotConnectedException if the session has no such connection) and disposes it afterwards.
    public abstract class ConnectionRequestHandler<TRequest, TResponse> : IQueryHandler<TRequest, TResponse>
        where TRequest : IQuery<TResponse>, IConnectionRequest
    {
        private readonly IDatabaseConnector _connector;

        protected ConnectionRequestHandler(IDatabaseConnector connector)
        {
            _connector = connector;
        }

        public async Task<TResponse> Handle(TRequest request, CancellationToken cancellationToken)
        {
            await using var database = await _connector.OpenAsync(request.SessionId, request.ConnectionId, request.DatabaseName, cancellationToken);
            return await Handle(request, database, cancellationToken);
        }

        protected abstract Task<TResponse> Handle(TRequest request, IDatabaseClient database, CancellationToken cancellationToken);
    }
}
