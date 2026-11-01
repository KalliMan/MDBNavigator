using MDBNavigator.Domain.Enums;
using MDBNavigator.Domain.ValueObjects;
using System.Net;

namespace MDBNavigator.Application.Contracts
{
    // Implemented by each DB-provider project; dispatched by IDatabaseProviderFactory.
    public interface IDbServerFactory
    {
        ServerType ServerType { get; }

        // Connects to one of the addresses (tried in order), never to settings.ServerName: the addresses are the ones
        // IConnectionGuard checked, and resolving the name again could give a different one.
        Task<IDatabaseProvider> CreateAsync(ConnectionSettings settings, IReadOnlyList<IPAddress> addresses, string? databaseName = null, CancellationToken ct = default);
    }
}
