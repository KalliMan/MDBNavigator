using MDBNavigator.DAL.Core;
using MDBNavigator.DAL.Interfaces;
using Models;

namespace MDBNavigator.DAL
{
    public sealed class DBConnection: IDisposable
    {
        IDBServerBase _dbServer= null!;
        private DBConnection()
        { }

        public void Dispose()
        {
            _dbServer.Disconnect();
            _dbServer = null!;
        }

        public static async Task<DBConnection> CreateConnection(ConnectionSettings details)
        {
            var instance = new DBConnection();
            await instance.Connect(details);

            return instance;
        }

        public string DataSource
        {
            get => _dbServer.DataSource;
        }

        private async Task Connect(ConnectionSettings details)
        {
            var connectionType = DBConnectionType.ConnectionTypes[details.ServerType];
            switch (connectionType)
            {
                case Enums.ServerType.PostgreSQL:
                    _dbServer = new PostgreSQL.PostgreSQL();
                    break;
                default:
                    throw new Exception("Not supported Server");
            }

            await _dbServer.Connect(details);
        }

        public async Task<IEnumerable<DatabaseDto>> GetDatabases()
            => await _dbServer.GetDatabases();
/*
        public async Task<IEnumerable<DatabaseSchemaDto>> GetDatabaseSchemas()
            => await _dbServer.GetDatabaseSchemas();
*/
        public async Task<IEnumerable<TableDto>> GetTables(string databaseName)
            => await _dbServer.GetTables(databaseName);

        public async Task<DatabaseCommandResultRaw> GetTopNTableRecords(string databaseName, string schema, string table, int? recordsNumber)
            => await _dbServer.GetTopNTableRecords(databaseName, schema, table, recordsNumber);
        /*
                public DatabaseConnectionInfoDto GetDetails()
                    => _dbServer.GetDetails();

                public async Task<DatabaseCommandResultRaw> ExecuteQuery(string script)
                {
                    return await _dbServer.ExecuteQuery(script);
                }
        */
    }
}
