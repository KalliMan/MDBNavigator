using Models.Command;
using Models.Connect;
using Models.Schema.Database;
using Models.Schema.Procedure;
using Models.Schema.Table;
using Models.Schema.View;

namespace MDBNavigator.DAL.Interfaces
{
    public interface IDBServerBase: IAsyncDisposable
    {
        string DataSource { get; }

        Task Connect(ConnectionSettings details, string? databaseName = null);
        Task Disconnect();

        Task<IEnumerable<DatabaseDto>> GetDatabases();
        
        Task<IEnumerable<Table>> GetTables();
        Task<TableDefinition> GetTableDefinition(string schema, string table);

        Task<IEnumerable<ProcedureDto>> GetStoredProcedures();
         string GetCreateStoredProcedureScript(string schema);

        Task<IEnumerable<ProcedureDto>> GetFunctions();
        string GetCreateFunctionProcedureScript(string schema);


        Task<string> GetProcedureDefinition(string schema, string name);
        string GetDropProcedureScript(string schema, string name);

        
        Task<IEnumerable<ViewDto>> GetViews();
        Task<string> GetViewDefinition(string schema, string name);
        string GetCreateViewScript(string schema);
        string GetDropViewScript(string schema, string name);

        Task<DatabaseSingleCommandResultRaw> GetTopNTableRecords(string schema, string table, int? recordsNumber);
        string GetTopNTableRecordsScript(string schema, string table, int? recordsNumber);
        string GetCreateNewTableScript(string schema);
        Task<string> GetCreateTableScript(string schema, string table);
        string GetDropTableScript(string schema, string table);
        Task<string> GetInsertTableScript(string schema, string table);

        Task<DatabaseSingleCommandResultRaw> ExecuteSingleQuery(string cmdQuery, object? parameters = null);
        Task<DatabaseCommandResultRaw> ExecuteQuery(string cmdQuery, object? parameters = null);
    }
}
