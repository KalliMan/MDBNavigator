using Models.Command;
using Models.Connect;
using Models.Schema;

namespace MDBNavigator.DAL.Interfaces
{
    public interface IDBServerBase: IAsyncDisposable
    {
        string DataSource { get; }

        Task Connect(ConnectionSettings details, string? databaseName = null);
        Task Disconnect();

        Task<IEnumerable<DatabaseDto>> GetDatabases();
        Task<IEnumerable<TableDto>> GetTables();

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

        Task<DatabaseCommandResultRaw> GetTopNTableRecords(string schema, string table, int? recordsNumber);
        string GetTopNTableRecordsScript(string schema, string table, int? recordsNumber);
        string GetCreateTableScript(string schema);
        string GetDropTableScript(string schema, string table);

        Task<DatabaseCommandResultRaw> ExecuteQuery(string cmdQuery);
    }
}
