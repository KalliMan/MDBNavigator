using MDBNavigator.BL.DTOs;
using Models.Schema.Database;
using Models.Schema.Procedure;
using Models.Schema.Table;
using Models.Schema.View;

namespace MDBNavigator.BL.Services
{
    public interface IDatabaseMetadataService
    {
        Task<DatabasesDetailsDto> GetDatabases(string sessionId, string connectionId);
        Task<TablesDetailsDto> GetTables(string sessionId, string connectionId, string databaseName);
        Task<TableDefinitionDto> GetTableDefinition(string sessionId, string connectionId, string databaseName, string schema, string table);

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

        Task<string> GetTopNTableRecordsScript(string id, string sessionId, string connectionId, string databaseName, string schema, string table, int? recordsNumber);
        Task<string> GetCreateNewTableScript(string sessionId, string connectionId, string databaseName, string schema);
        Task<string> GetCreateTableScript(string sessionId, string connectionId, string databaseName, string schema, string table);
        Task<string> GetDropTableScript(string sessionId, string connectionId, string databaseName, string schema, string table);
        Task<string> GetInsertTableScript(string sessionId, string connectionId, string databaseName, string schema, string table);
    }
}