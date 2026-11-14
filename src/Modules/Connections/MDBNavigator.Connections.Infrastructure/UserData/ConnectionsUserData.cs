using MDBNavigator.Connections.Application;
using MDBNavigator.Connections.Infrastructure.Persistence;
using MDBNavigator.SharedKernel.UserData;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MDBNavigator.Connections.Infrastructure.UserData
{
    // Saved connections and cached connections of a deleted account.
    public class ConnectionsUserData : IUserDataEraser
    {
        private readonly ConnectionsDbContext _db;
        private readonly IConnectionCache _cache;
        private readonly ILogger<ConnectionsUserData> _logger;

        public ConnectionsUserData(ConnectionsDbContext db, IConnectionCache cache, ILogger<ConnectionsUserData> logger)
        {
            _db = db;
            _cache = cache;
            _logger = logger;
        }

        // Saved connections have no foreign key to users (see ConnectionsDbContext), so they are removed here.
        public async Task EraseAsync(string userId, CancellationToken cancellationToken)
        {
            var saved = await _db.SavedConnections.Where(c => c.OwnerId == userId).ExecuteDeleteAsync(cancellationToken);
            var cached = _cache.RemoveAllForUser(userId);

            // No user id or email in the log: it's personal data.
            _logger.LogInformation("Removed {SavedConnections} saved connections and {CachedConnections} cached connections of a deleted account",
                saved, cached);
        }
    }
}
