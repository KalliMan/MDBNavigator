using MDBNavigator.Domain.Entities;

namespace MDBNavigator.Application.Contracts
{
    // The saved connections in the app database. Every method takes the owner, so one user can never read or change
    // another user's rows, even with a known id.
    public interface ISavedConnectionStore
    {
        // Ordered by name, ignoring case. Not tracked.
        Task<IReadOnlyList<SavedConnection>> ListAsync(string ownerId, CancellationToken cancellationToken);

        // Tracked: change it and call SaveChangesAsync. Null when it doesn't exist or belongs to someone else.
        Task<SavedConnection?> FindAsync(string ownerId, Guid id, CancellationToken cancellationToken);

        Task<int> CountAsync(string ownerId, CancellationToken cancellationToken);

        // exceptId: the connection being renamed, which may keep its own name.
        Task<bool> NameExistsAsync(string ownerId, string normalizedName, Guid? exceptId, CancellationToken cancellationToken);

        Task AddAsync(SavedConnection connection, CancellationToken cancellationToken);

        Task SaveChangesAsync(CancellationToken cancellationToken);

        // False when it doesn't exist or belongs to someone else.
        Task<bool> DeleteAsync(string ownerId, Guid id, CancellationToken cancellationToken);
    }
}
