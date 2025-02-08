//using MDBNavigator.BL.SignalR;
using Models.Command;
using Models.Connect;
using Models.Schema;
namespace MDBNavigator.BL.Services
{
    public interface IDBManager
    {
        Task<bool> Connect(string sessionId, ConnectionSettings details);

        Task<DatabasesDetailsDto> GetDatabases(string sessionId);
        Task<TablesDetailsDto> GetTables(string sessionId, string databaseName);
        Task<ProceduresDetailsDto> GetStoredProcedures(string sessionId, string databaseName);
        Task<ProceduresDetailsDto> GetFunctions(string sessionId, string databaseName);
        Task<string> GetProcedureDefinition(string sessionId, string databaseName, string schema, string name);

        Task<DatabaseCommandResultDto> GetTopNTableRecords(string id, string sessionId, string databaseName, string schema, string table, int? recordsNumber);
        Task<string> GetTopNTableRecordsScript(string id, string sessionId, string databaseName, string schema, string table, int? recordsNumber);
        Task<string> GetCreateTableScript(string sessionId, string databaseName, string schema);
        Task<string> GetDropTableScript(string sessionId, string databaseName, string schema, string table);

        Task<DatabaseCommandResultDto> ExecuteQuery(string sessionId, string id, string databaseName, string cmdQuery);
    }
}
