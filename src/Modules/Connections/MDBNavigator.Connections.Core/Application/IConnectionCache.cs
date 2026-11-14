using MDBNavigator.Providers.Abstractions;
using System.Diagnostics.CodeAnalysis;

namespace MDBNavigator.Connections.Application
{
    public interface IConnectionCache
    {
        void Set(string sessionId, string connectionId, ConnectionSettings settings);
        bool TryGet(string sessionId, string connectionId, [NotNullWhen(true)] out ConnectionSettings? settings);
        bool Remove(string sessionId, string connectionId);

        // Forgets every connection of the user, in all their browser tabs (e.g. when the account is deleted).
        // Returns how many were removed.
        int RemoveAllForUser(string userId);
    }
}
