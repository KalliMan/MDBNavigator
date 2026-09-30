using MDBNavigator.Domain.ValueObjects;

namespace MDBNavigator.Application.Contracts
{
    public interface IDatabaseProviderFactory
    {
        Task<IDatabaseProvider> CreateAsync(ConnectionSettings settings, string? databaseName = null);
    }
}
