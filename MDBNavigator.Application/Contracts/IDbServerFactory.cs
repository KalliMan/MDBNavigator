using MDBNavigator.Domain.Enums;
using MDBNavigator.Domain.ValueObjects;

namespace MDBNavigator.Application.Contracts
{
    // Implemented by each DB-provider project; dispatched by IDatabaseProviderFactory.
    public interface IDbServerFactory
    {
        ServerType ServerType { get; }
        Task<IDatabaseProvider> CreateAsync(ConnectionSettings settings, string? databaseName = null);
    }
}
