using System.Net;

namespace MDBNavigator.Application.Contracts
{
    // Decides which database hosts the server may connect to (ConnectionGuard settings).
    public interface IConnectionGuard
    {
        // Resolves the host and checks every address it resolves to. Returns the addresses to connect to, or throws
        // ConnectionNotAllowedException. Providers connect to these addresses, never to the host name itself:
        // resolving the name again could give a different (unchecked) address.
        Task<IReadOnlyList<IPAddress>> GetAllowedAddressesAsync(string host, CancellationToken ct = default);
    }
}
