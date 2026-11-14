using System.Net;
using System.Net.Sockets;

namespace MDBNavigator.API.ReverseProxy
{
    public class ReverseProxyOptions
    {
        public const string SectionName = "ReverseProxy";

        // The proxies in front of the app: IP addresses or ranges such as 172.16.0.0/12. Only their
        // X-Forwarded-For and X-Forwarded-Proto are believed. Empty: only a proxy on this machine (loopback).
        public List<string> TrustedNetworks { get; set; } = [];

        // Each entry as a network; a single address becomes a network of that one address.
        // Throws InvalidOperationException naming the entry when it is neither an address nor a range.
        public static IReadOnlyList<IPNetwork> Parse(IEnumerable<string> entries)
        {
            var networks = new List<IPNetwork>();
            foreach (var entry in entries)
            {
                var value = (entry ?? "").Trim();
                if (IPAddress.TryParse(value, out var address))
                {
                    networks.Add(new IPNetwork(address, address.AddressFamily == AddressFamily.InterNetwork ? 32 : 128));
                }
                else if (value.Contains('/') && IPNetwork.TryParse(value, out var network))
                {
                    networks.Add(network);
                }
                else
                {
                    // Thrown at startup (Program.cs builds the forwarded-headers options before anything is served), so a
                    // typo can't silently trust nobody, or the wrong network.
                    throw new InvalidOperationException(
                        $"{SectionName}:TrustedNetworks: '{entry}' is not an IP address or a range like 10.0.0.0/8.");
                }
            }
            return networks;
        }
    }
}
