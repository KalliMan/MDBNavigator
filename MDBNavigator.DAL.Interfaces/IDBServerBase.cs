using Models.Command;
using Models.Connect;
using Models.Schema;

namespace MDBNavigator.DAL.Interfaces
{
    public interface IDBServerBase: IAsyncDisposable
    {
        string DataSource { get; }

        Task Connect(ConnectionSettings details);
        Task Disconnect();

        Task<IEnumerable<DatabaseDto>> GetDatabases();
        Task<IEnumerable<TableDto>> GetTables();
        Task<IEnumerable<ProcedureDto>> GetStoredProcedures();
        Task<IEnumerable<ProcedureDto>> GetFunctions();
        Task<IEnumerable<ViewDto>> GetViews();

        Task<string> GetProcedureDefinition(string schema, string name);
        Task<string> GetViewDefinition(string schema, string name);

        Task<DatabaseCommandResultRaw> GetTopNTableRecords(string schema, string table, int? recordsNumber);
        string GetTopNTableRecordsScript(string schema, string table, int? recordsNumber);
        string GetCreateTableScript(string schema);
        string GetDropTableScript(string schema, string table);

        Task<DatabaseCommandResultRaw> ExecuteQuery(string cmdQuery);
    }
}
