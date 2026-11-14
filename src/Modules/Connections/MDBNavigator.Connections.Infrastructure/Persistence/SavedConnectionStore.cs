using MDBNavigator.Connections.Application.SavedConnections;
using MDBNavigator.Connections.Domain;
using Microsoft.EntityFrameworkCore;

namespace MDBNavigator.Connections.Infrastructure.Persistence
{
    public class SavedConnectionStore : ISavedConnectionStore
    {
        private readonly ConnectionsDbContext _db;

        public SavedConnectionStore(ConnectionsDbContext db)
        {
            _db = db;
        }

        public async Task<IReadOnlyList<SavedConnection>> ListAsync(string ownerId, CancellationToken cancellationToken)
            => await _db.SavedConnections.AsNoTracking()
                .Where(c => c.OwnerId == ownerId)
                .OrderBy(c => c.NormalizedName).ThenBy(c => c.Name)
                .ToListAsync(cancellationToken);

        public Task<SavedConnection?> FindAsync(string ownerId, Guid id, CancellationToken cancellationToken)
            => _db.SavedConnections.FirstOrDefaultAsync(c => c.Id == id && c.OwnerId == ownerId, cancellationToken);

        public Task<int> CountAsync(string ownerId, CancellationToken cancellationToken)
            => _db.SavedConnections.CountAsync(c => c.OwnerId == ownerId, cancellationToken);

        // The null check is written out, so the intent doesn't rest on EF's null semantics for "c.Id != exceptId".
        public Task<bool> NameExistsAsync(string ownerId, string normalizedName, Guid? exceptId, CancellationToken cancellationToken)
            => _db.SavedConnections.AnyAsync(
                c => c.OwnerId == ownerId && c.NormalizedName == normalizedName && (exceptId == null || c.Id != exceptId.Value),
                cancellationToken);

        public async Task AddAsync(SavedConnection connection, CancellationToken cancellationToken)
        {
            _db.SavedConnections.Add(connection);
            await _db.SaveChangesAsync(cancellationToken);
        }

        public Task SaveChangesAsync(CancellationToken cancellationToken) => _db.SaveChangesAsync(cancellationToken);

        public async Task<bool> DeleteAsync(string ownerId, Guid id, CancellationToken cancellationToken)
            => await _db.SavedConnections.Where(c => c.Id == id && c.OwnerId == ownerId).ExecuteDeleteAsync(cancellationToken) > 0;
    }
}
