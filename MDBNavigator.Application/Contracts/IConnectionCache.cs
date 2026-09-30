using MDBNavigator.Domain.ValueObjects;

namespace MDBNavigator.Application.Contracts
{
    public interface IConnectionCache
    {
        void Set(string key, ConnectionSettings settings);
        bool TryGet(string key, out ConnectionSettings? settings);
        bool Remove(string key);
    }
}
