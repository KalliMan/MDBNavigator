using MDBNavigator.BL.DTOs;
using Models.Command;
using Models.Connect;
using Models.Schema;
namespace MDBNavigator.BL.Services
{
    public interface IDBManager
    {
        Task<ConnectedResultDto> Connect(string sessionId, ConnectionSettings connectionSettings);
        Task<ConnectedResultDto> Reconnect(string sessionId, string connectionId, ConnectionSettings connectionSettings);
        void Disconnect(string sessionId, string connectionId);

        Task<DatabasesDetailsDto> GetDatabases(string sessionId, string connectionId);
        Task<TablesDetailsDto> GetTables(string sessionId, string connectionId, string databaseName);

        Task<ProceduresDetailsDto> GetStoredProcedures(string sessionId, string connectionId, string databaseName);
        Task<ProceduresDetailsDto> GetFunctions(string sessionId, string connectionId, string databaseName);
        Task<string> GetProcedureDefinition(string sessionId, string connectionId, string databaseName, string schema, string name);
        Task<string> GetCreateStoredProcedureScript(string sessionId, string connectionId, string databaseName, string schema);
        Task<string> GetCreateFunctionProcedureScript(string sessionId, string connectionId, string databaseName, string schema);
        Task<string> GetDropProcedureScript(string sessionId, string connectionId, string databaseName, string schema, string name);

        Task<ViewDetailsDto> GetViews(string sessionId, string connectionId, string databaseName);
        Task<string> GetViewDefinition(string sessionId, string connectionId, string databaseName, string schema, string name);
        Task<string> GetCreateViewScript(string sessionId, string connectionId, string databaseName, string schema);
        Task<string> GetDropViewScript(string sessionId, string connectionId, string databaseName, string schema, string name);

        Task<DatabaseCommandResultDto> GetTopNTableRecords(string id, string sessionId, string connectionId, string databaseName, string schema, string table, int? recordsNumber);
        Task<string> GetTopNTableRecordsScript(string id, string sessionId, string connectionId, string databaseName, string schema, string table, int? recordsNumber);
        Task<string> GetCreateTableScript(string sessionId, string connectionId, string databaseName, string schema);
        Task<string> GetDropTableScript(string sessionId, string connectionId, string databaseName, string schema, string table);

        Task<DatabaseCommandResultDto> ExecuteQuery(string sessionId, string connectionId, string id, string databaseName, string cmdQuery);
    }
}
