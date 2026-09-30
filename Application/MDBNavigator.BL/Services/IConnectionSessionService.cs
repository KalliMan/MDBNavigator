using MDBNavigator.BL.DTOs;
using MDBNavigator.DAL;
using Models.Connect;

namespace MDBNavigator.BL.Services
{
    public interface IConnectionSessionService
    {
        Task<ConnectedResultDto> Connect(string sessionId, string connectionId, ConnectionSettings connectionSettings);
        void Disconnect(string sessionId, string connectionId);
        Task<DBConnection> CreateConnection(string sessionId, string connectionId, string? databaseName = null);
    }
}