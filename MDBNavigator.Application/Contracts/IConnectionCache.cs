using MDBNavigator.Domain.ValueObjects;

namespace MDBNavigator.Application.Contracts
{
    public interface IConnectionCache
    {
        void Set(string key, ConnectionSettings settings);
        bool TryGet(string key, out ConnectionSettings? settings);
        bool Remove(string key);

        // Forgets every connection of the user, in all their browser tabs (e.g. when the account is deleted).
        // Returns how many were removed.
        int RemoveAllForUser(string userId);
    }
}
