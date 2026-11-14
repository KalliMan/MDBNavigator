using Microsoft.AspNetCore.HttpOverrides;

namespace MDBNavigator.API.ReverseProxy
{
    public static class ForwardedHeadersSetup
    {
        // X-Forwarded-For and X-Forwarded-Proto, from loopback and from ReverseProxy:TrustedNetworks only.
        // Logs once which networks are trusted.
        public static IApplicationBuilder UseTrustedForwardedHeaders(this WebApplication app, ReverseProxyOptions options)
        {
            var trusted = ReverseProxyOptions.Parse(options.TrustedNetworks);

            // The framework's defaults stay: loopback is trusted and one proxy hop is read. Behind a proxy in another
            // container the proxy's address is not loopback, so without the configured networks every visitor would have
            // the proxy's address (one shared rate limit) and the app would think every request is plain HTTP (no HSTS).
            // The lists are never cleared: trusting every sender would let any client fake its address.
            var forwarded = new ForwardedHeadersOptions
            {
                ForwardedHeaders = ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedFor
            };
            foreach (var network in trusted)
            {
                forwarded.KnownIPNetworks.Add(network);
            }

            var logger = app.Services.GetRequiredService<ILoggerFactory>().CreateLogger(typeof(ForwardedHeadersSetup).FullName!);
            if (trusted.Count == 0)
            {
                logger.LogInformation("Forwarded headers are trusted from loopback only");
            }
            else
            {
                logger.LogInformation("Forwarded headers are trusted from loopback and {Count} configured networks: {Networks}",
                    trusted.Count, string.Join(", ", trusted));
            }

            return app.UseForwardedHeaders(forwarded);
        }
    }
}
