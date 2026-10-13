using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.DTOs;
using MDBNavigator.Domain.Enums;
using MDBNavigator.Domain.Exceptions;
using MDBNavigator.Domain.ValueObjects;

namespace MDBNavigator.Application.Features
{
    internal static class DbConnectionHelper
    {
        internal static string GetCacheKey(string sessionId, string connectionId)
            => $"{sessionId}_{connectionId}";

        internal static async Task<ConnectedResultDto> ConnectAsync(
            IConnectionCache cache,
            IDatabaseProviderFactory factory,
            string sessionId,
            string connectionId,
            ConnectionSettings settings)
        {
            await using var provider = await factory.CreateAsync(settings);
            cache.Set(GetCacheKey(sessionId, connectionId), settings);

            var serverType = settings.ServerType switch
            {
                "PostgreSQL" => ServerType.PostgreSQL,
                "MS SQL Server" => ServerType.MSSQLServer,
                _ => ServerType.None
            };

            return new ConnectedResultDto
            {
                ConnectionId = connectionId,
                ConnectionName = $"{settings.ServerName}:{settings.Port}",
                ServerName = settings.ServerName,
                Port = settings.Port,
                ServerType = serverType,
                UserName = settings.UserName
            };
        }

        // Creates a scoped DB provider for the connection identified by sessionId + connectionId.
        internal static async Task<IDatabaseProvider> CreateProviderAsync(
            IConnectionCache cache,
            IDatabaseProviderFactory factory,
            string sessionId,
            string connectionId,
            string? databaseName = null)
        {
            var key = GetCacheKey(sessionId, connectionId);
            if (!cache.TryGet(key, out var settings) || settings is null)
            {
                throw new NotConnectedException("Not Connected! Please reconnect.");
            }

            return await factory.CreateAsync(settings, databaseName);
        }
    }
}

