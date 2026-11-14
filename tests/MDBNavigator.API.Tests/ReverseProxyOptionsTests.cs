using MDBNavigator.API.ReverseProxy;
using System.Net;

namespace MDBNavigator.API.Tests
{
    public class ReverseProxyOptionsTests
    {
        [Fact]
        public void An_empty_list_gives_no_networks()
        {
            Assert.Empty(ReverseProxyOptions.Parse([]));
        }

        [Fact]
        public void A_range_is_parsed_as_written()
        {
            var networks = ReverseProxyOptions.Parse(["172.16.0.0/12"]);

            Assert.Contains(networks, n => n.Contains(IPAddress.Parse("172.20.1.5")));
            Assert.DoesNotContain(networks, n => n.Contains(IPAddress.Parse("172.32.0.1")));
        }

        [Fact]
        public void A_single_address_becomes_a_network_of_one()
        {
            var networks = ReverseProxyOptions.Parse(["10.1.2.3"]);

            Assert.Contains(networks, n => n.Contains(IPAddress.Parse("10.1.2.3")));
            Assert.DoesNotContain(networks, n => n.Contains(IPAddress.Parse("10.1.2.4")));
        }

        [Fact]
        public void IPv6_is_accepted()
        {
            var networks = ReverseProxyOptions.Parse(["fd00::/8"]);

            Assert.Contains(networks, n => n.Contains(IPAddress.Parse("fd12::1")));
        }

        [Fact]
        public void Entries_are_trimmed()
        {
            var networks = ReverseProxyOptions.Parse([" 10.0.0.0/8 "]);

            Assert.Contains(networks, n => n.Contains(IPAddress.Parse("10.9.9.9")));
        }

        [Fact]
        public void A_bad_entry_names_itself()
        {
            var error = Assert.Throws<InvalidOperationException>(() => ReverseProxyOptions.Parse(["not-an-address"]));

            Assert.Contains("not-an-address", error.Message);
        }

        [Fact]
        public void An_empty_entry_is_refused()
        {
            Assert.Throws<InvalidOperationException>(() => ReverseProxyOptions.Parse([" "]));
        }
    }
}
