using MDBNavigator.BL.Cache;
using MDBNavigator.BL.DTOs;
using MDBNavigator.BL.Exceptions;
using MDBNavigator.DAL;
using MDBNavigator.DAL.Enums;
using MDBNavigator.DAL.Interfaces;
using Microsoft.Extensions.Logging;
using Models.Connect;

namespace MDBNavigator.BL.Services
{
    public class ConnectionSessionService : IConnectionSessionService
    {
        private readonly IConnectionSettingsMemoryCache _memoryCache;
        private readonly IDBServerFactory _dbServerFactory;
        private readonly ILogger<ConnectionSessionService> _logger;

        public ConnectionSessionService(IConnectionSettingsMemoryCache memoryCache, IDBServerFactory dbServerFactory, ILogger<ConnectionSessionService> logger)
        {
            _memoryCache = memoryCache;
            _dbServerFactory = dbServerFactory;
            _logger = logger;
        }

        public async Task<ConnectedResultDto> Connect(string sessionId, string connectionId, ConnectionSettings connectionSettings)
        {
            var cachekey = GetSessionConnectionID(sessionId, connectionId);

            await using var connection = await DBConnection.CreateConnection(_dbServerFactory, connectionSettings);
            _memoryCache[cachekey] = connectionSettings;

            var serverType = connectionSettings.ServerType switch
            {
                "PostgreSQL" => ServerType.PostgreSQL,
                "MS SQL Server" => ServerType.MSSQLServer,
                _ => ServerType.None
            };

            return new()
            {
                ConnectionId = connectionId,
                ConnectionName = $"{connectionSettings.ServerName}:{connectionSettings.Port}",
                ServerName = connectionSettings.ServerName,
                Port = connectionSettings.Port,
                ServerType = serverType,
                UserName = connectionSettings.UserName,
            };
        }

        public void Disconnect(string sessionId, string connectionId)
        {
            _logger.LogInformation("Disconnecting session {SessionId}, connection {ConnectionId}", sessionId, connectionId);
            var cachekey = GetSessionConnectionID(sessionId, connectionId);
            _memoryCache.Remove(cachekey);
        }

        public async Task<DBConnection> CreateConnection(string sessionId, string connectionId, string? databaseName = null)
        {
            _logger.LogInformation("Creating DB connection for session {SessionId}, connection {ConnectionId}, database {DatabaseName}",
                sessionId,
                connectionId,
                databaseName ?? "<default>");

            var result = _memoryCache.TryGetValue(GetSessionConnectionID(sessionId, connectionId), out var details);
            if (!result || details == null)
            {
                _logger.LogWarning("Attempt to create DB connection for not connected session {SessionId}, connection {ConnectionId}",
                    sessionId,
                    connectionId);
                throw new NotConnectedException("Not Connected! Please reconnect.");
            }

            return await DBConnection.CreateConnection(_dbServerFactory, details, databaseName);
        }

        private static string GetSessionConnectionID(string sessionId, string connectionId)
            => $"{sessionId}_{connectionId}";
    }
}