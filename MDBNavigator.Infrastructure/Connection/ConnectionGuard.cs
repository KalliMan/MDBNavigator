using MDBNavigator.Application.Contracts;
using MDBNavigator.Domain.Exceptions;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Net.Sockets;

namespace MDBNavigator.Infrastructure.Connection
{
    // Keeps users out of the server's own network where that matters (ConnectionGuard:Mode). The host is resolved
    // here, every address is checked, and the provider gets those addresses, never the name: if the provider
    // resolved the name again, a DNS server could answer with a public address for the check and a private one
    // for the connection (DNS rebinding).
    public class ConnectionGuard : IConnectionGuard
    {
        // Cloud metadata services hand out the server's cloud credentials. No database runs there, so they are
        // refused in every mode, even when an Allow entry covers them.
        private static readonly IPAddress[] MetadataAddresses =
        [
            IPAddress.Parse("169.254.169.254"), // AWS, Azure, Google Cloud, Oracle, DigitalOcean, ...
            IPAddress.Parse("169.254.170.2"),   // AWS ECS task metadata
            IPAddress.Parse("169.254.170.23"),  // AWS EKS Pod Identity
            IPAddress.Parse("168.63.129.16"),   // Azure WireServer (a public address, reachable only inside Azure)
            IPAddress.Parse("100.100.100.200"), // Alibaba Cloud
            IPAddress.Parse("192.0.0.192"),     // Oracle Cloud, older instances
            IPAddress.Parse("fd00:ec2::254"),   // AWS, IPv6
            IPAddress.Parse("fd00:ec2::23"),    // AWS EKS Pod Identity, IPv6
        ];

        // Everything that isn't the public internet: the server's own machine and networks, and reserved ranges.
        // IPv6 forms that carry an IPv4 address are unwrapped first (see Unwrap), so the IPv4 ranges cover them.
        private static readonly IPNetwork[] NonPublicNetworks =
        [
            IPNetwork.Parse("0.0.0.0/8"),       // "this network"; 0.0.0.0 reaches the local machine on Linux
            IPNetwork.Parse("10.0.0.0/8"),      // private
            IPNetwork.Parse("100.64.0.0/10"),   // carrier-grade NAT, also used inside clouds
            IPNetwork.Parse("127.0.0.0/8"),     // loopback
            IPNetwork.Parse("169.254.0.0/16"),  // link-local
            IPNetwork.Parse("172.16.0.0/12"),   // private, also Docker's default networks
            IPNetwork.Parse("192.0.0.0/24"),    // IETF protocol assignments
            IPNetwork.Parse("192.0.2.0/24"),    // documentation
            IPNetwork.Parse("192.88.99.0/24"),  // old 6to4 relays
            IPNetwork.Parse("192.168.0.0/16"),  // private
            IPNetwork.Parse("198.18.0.0/15"),   // benchmarking
            IPNetwork.Parse("198.51.100.0/24"), // documentation
            IPNetwork.Parse("203.0.113.0/24"),  // documentation
            IPNetwork.Parse("224.0.0.0/4"),     // multicast
            IPNetwork.Parse("240.0.0.0/4"),     // reserved, broadcast
            IPNetwork.Parse("::/96"),           // unspecified, loopback, the old IPv4-compatible form
            IPNetwork.Parse("64:ff9b:1::/48"),  // local NAT64
            IPNetwork.Parse("100::/64"),        // discard
            IPNetwork.Parse("2001::/23"),       // IETF protocol assignments (Teredo, ...)
            IPNetwork.Parse("2001:db8::/32"),   // documentation
            IPNetwork.Parse("fc00::/7"),        // unique local (private)
            IPNetwork.Parse("fe80::/10"),       // link-local
            IPNetwork.Parse("fec0::/10"),       // old site-local
            IPNetwork.Parse("ff00::/8"),        // multicast
        ];

        private static readonly IPNetwork Nat64Network = IPNetwork.Parse("64:ff9b::/96");
        private static readonly IPNetwork SixToFourNetwork = IPNetwork.Parse("2002::/16");

        private readonly ConnectionGuardMode _mode;
        private readonly HashSet<string> _allowedNames = new(StringComparer.OrdinalIgnoreCase);
        private readonly List<IPNetwork> _allowedNetworks = [];

        public ConnectionGuard(ConnectionGuardOptions options, ILogger<ConnectionGuard> logger)
        {
            // Program.cs always sets the mode; Public is the safe fallback.
            _mode = options.Mode ?? ConnectionGuardMode.Public;

            foreach (var entry in options.Allow)
            {
                var value = entry.Trim();
                if (IPAddress.TryParse(value, out var address))
                {
                    _allowedNetworks.Add(new IPNetwork(address, address.AddressFamily == AddressFamily.InterNetwork ? 32 : 128));
                }
                else if (value.Contains('/') && IPNetwork.TryParse(value, out var network))
                {
                    _allowedNetworks.Add(network);
                }
                else if (IsHostName(value))
                {
                    _allowedNames.Add(value.TrimEnd('.'));
                }
                else
                {
                    // Thrown at startup (Program.cs creates the guard there), so a typo can't silently block or allow.
                    throw new InvalidOperationException(
                        $"ConnectionGuard:Allow entry '{entry}' is not a host name, an IP address or a range such as 10.20.0.0/16.");
                }
            }

            logger.LogInformation("Connection guard: {Mode}, {AllowCount} allow entries", _mode, options.Allow.Count);
        }

        public async Task<IReadOnlyList<IPAddress>> GetAllowedAddressesAsync(string host, CancellationToken ct = default)
        {
            var name = NormalizeHost(host);
            // An IP address is taken as is: DNS refuses some (0.0.0.0) with a message that explains nothing.
            var addresses = IPAddress.TryParse(name, out var literal)
                ? [literal]
                : await Dns.GetHostAddressesAsync(name, ct);
            if (addresses.Length == 0)
            {
                throw new ArgumentException($"'{host}' doesn't resolve to any address.");
            }

            var allowedByName = _allowedNames.Contains(name);

            // Every address is checked, not just the first: otherwise a name could carry one public and one private
            // address. The messages name the host but not the address, so internal DNS answers aren't revealed.
            foreach (var address in addresses)
            {
                var ip = Unwrap(address);

                if (MetadataAddresses.Contains(ip))
                {
                    throw new ConnectionNotAllowedException($"Connections to cloud metadata addresses aren't allowed ({host}).");
                }

                if (_mode == ConnectionGuardMode.Off || allowedByName
                    || _allowedNetworks.Any(n => n.Contains(ip) || n.Contains(address)))
                {
                    continue;
                }

                if (_mode == ConnectionGuardMode.AllowList)
                {
                    throw new ConnectionNotAllowedException(
                        $"This server only connects to the database servers its administrator has listed ({host} isn't one of them).");
                }

                if (NonPublicNetworks.Any(n => n.Contains(ip)))
                {
                    throw new ConnectionNotAllowedException(
                        $"Connections to private or local network addresses aren't allowed on this server ({host}).");
                }
            }

            return addresses;
        }

        // Only a host name or an IP address. Npgsql reads more into its Host value: "/path" is a Unix socket,
        // "a,b" lists several hosts and "host:port" carries a port, none of which the checks above would see.
        private static string NormalizeHost(string host)
        {
            var value = host.Trim();
            if (IPAddress.TryParse(value, out var address))
            {
                return address.ToString();
            }

            if (IsHostName(value))
            {
                return value.TrimEnd('.');
            }

            throw new ArgumentException($"'{host}' is not a host name or an IP address.");
        }

        // Letters, digits, '-', '_' (Docker Compose service names) and dots; DNS rejects anything else that's malformed.
        private static bool IsHostName(string value)
            => value.Length is > 0 and <= 253
                && !value.StartsWith('.')
                && value.All(c => char.IsAsciiLetterOrDigit(c) || c is '-' or '_' or '.');

        // IPv6 addresses that carry an IPv4 address are judged by that address: ::ffff:127.0.0.1 is 127.0.0.1.
        private static IPAddress Unwrap(IPAddress address)
        {
            if (address.AddressFamily != AddressFamily.InterNetworkV6)
            {
                return address;
            }

            if (address.IsIPv4MappedToIPv6)
            {
                return address.MapToIPv4();
            }

            var bytes = address.GetAddressBytes();
            if (Nat64Network.Contains(address))
            {
                return new IPAddress(bytes[12..16]);
            }

            if (SixToFourNetwork.Contains(address))
            {
                return new IPAddress(bytes[2..6]);
            }

            return address;
        }
    }
}
