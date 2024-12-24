using Models;

namespace MDBNavigator.DAL.Interfaces
{
    public interface IDBServerBase
    {
        string DataSource { get; }

        Task Connect(ConnectionSettings details);
        //DatabaseConnectionInfoDto GetDetails();
        Task Disconnect();

        Task<IEnumerable<DatabaseDto>> GetDatabases();
        //Task<IEnumerable<DatabaseSchemaDto>> GetDatabaseSchemas();

        Task<IEnumerable<TableDto>> GetTables(string databaseName);
        Task<DatabaseCommandResultRaw> GetTopNTableRecords(string databaseName, string schema, string table, int? recordsNumber);
        string GetTopNTableRecordsScript(string databaseName, string schema, string table, int? recordsNumber);
        Task<DatabaseCommandResultRaw> ExecuteQuery(string cmdQuery);
    }
}
