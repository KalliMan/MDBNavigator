using MDBNavigator.DAL.Core;
using MDBNavigator.DAL.Interfaces;
using Models.Command;
using Models.Connect;
using Models.Schema;

namespace MDBNavigator.DAL
{
    public sealed class DBConnection: IDisposable
    {
        IDBServerBase _dbServer= null!;

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
        public async Task<IEnumerable<TableDto>> GetTables()
            => await _dbServer.GetTables();
        public async Task<IEnumerable<ProcedureDto>> GetStoredProcedures()
            => await _dbServer.GetStoredProcedures();
        public async Task<IEnumerable<ProcedureDto>> GetFunctions()
            => await _dbServer.GetFunctions();
        public async Task<IEnumerable<ViewDto>> GetViews()
            => await _dbServer.GetViews();

        public async Task<string> GetProcedureDefinition(string schema, string name)
            => await _dbServer.GetProcedureDefinition(schema, name);

        public async Task<DatabaseCommandResultRaw> GetTopNTableRecords(string schema, string table, int? recordsNumber)
            => await _dbServer.GetTopNTableRecords(schema, table, recordsNumber);

        public string GetTopNTableRecordsScript(string schema, string table, int? recordsNumber)
            => _dbServer.GetTopNTableRecordsScript(schema, table, recordsNumber);
        public string GetCreateTableScript(string schema)
          => _dbServer.GetCreateTableScript(schema);

        public string GetDropTableScript(string schema, string table)
          => _dbServer.GetDropTableScript(schema, table);

        public async Task<DatabaseCommandResultRaw> ExecuteQuery(string cmdQuery)        
            => await _dbServer.ExecuteQuery(cmdQuery);        

    }
}
