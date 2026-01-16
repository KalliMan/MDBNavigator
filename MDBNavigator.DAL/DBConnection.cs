using MDBNavigator.DAL.Core;
using MDBNavigator.DAL.Interfaces;
using Models.Command;
using Models.Connect;
using Models.Schema;

namespace MDBNavigator.DAL
{
    public sealed class DBConnection: IAsyncDisposable
    {
        IDBServerBase _dbServer= null!;

        public async ValueTask DisposeAsync()
        {
            await _dbServer.Disconnect();
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
            if (!DBConnectionType.ConnectionTypes.TryGetValue(details.ServerType, out var connectionType))
            {
                throw new NotSupportedException($"Unsupported server type '{details.ServerType}'.");
            }

            switch (connectionType)
            {
                case Enums.ServerType.PostgreSQL:
                    _dbServer = new PostgreSQL.PostgreSQL();
                    break;
                case Enums.ServerType.MSSQLServer:
                    throw new NotSupportedException("MS SQL Server provider is not implemented yet.");
                default:
                    throw new NotSupportedException($"Server type '{connectionType}' is not supported.");
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

        public async Task<string> GetViewDefinition(string schema, string name)
            => await _dbServer.GetViewDefinition(schema, name);

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
