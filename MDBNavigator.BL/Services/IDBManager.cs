//using MDBNavigator.BL.SignalR;
using Models;
namespace MDBNavigator.BL.Services
{
    public interface IDBManager
    {
        Task<bool> Connect(string sessionId, ConnectionSettings details);
        Task<DatabasesDetailsDto> GetDatabases(string sessionId);
        Task<TablesDetailsDto> GetTables(string sessionId, string databaseName);

        Task<DatabaseCommandResultDto> GetTopNTableRecords(string id, string sessionId, string databaseName, string schema, string table, int? recordsNumber);
        Task<string> GetTopNTableRecordsScript(string id, string sessionId, string databaseName, string schema, string table, int? recordsNumber);
        Task<DatabaseCommandResultDto> ExecuteQuery(string sessionId, string id, string databaseName, string cmdQuery);
    }
}
