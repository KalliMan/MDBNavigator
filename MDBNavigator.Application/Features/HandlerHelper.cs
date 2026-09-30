using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.Features.Connection.Commands.Connect;
using MDBNavigator.Domain.Exceptions;

namespace MDBNavigator.Application.Features
{
    // Shared helper used by all query/command handlers that need a scoped DB provider.
    internal static class HandlerHelper
    {
        internal static async Task<IDatabaseProvider> CreateProviderAsync(
            IConnectionCache cache,
            IDatabaseProviderFactory factory,
            string sessionId,
            string connectionId,
            string? databaseName = null)
        {
            var key = ConnectCommandHandler.GetCacheKey(sessionId, connectionId);
            if (!cache.TryGet(key, out var settings) || settings is null)
            {
                throw new NotConnectedException("Not Connected! Please reconnect.");
            }

            return await factory.CreateAsync(settings, databaseName);
        }
    }
}
