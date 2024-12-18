//using MDBNavigator.BL.SignalR;
using Models;
namespace MDBNavigator.BL.Services
{
    public interface IDBManager
    {
        Task<bool> Connect(string sessionId, ConnectionSettings details);
        Task<DatabasesDetailsDto> GetDatabases(string sessionId);
        Task<TablesDetailsDto> GetTables(string sessionId, string databaseName);

        //Task<DatabaseCommandResultDto> ExecuteQuery(string sessionId, Guid id, string databaseName, string script);
    }
}
