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
        //Task<DatabaseCommandResultRaw> ExecuteQuery(string script);
    }
}
