using MDBNavigator.DAL.Core;
using MDBNavigator.DAL.Interfaces;
using Models.Command;
using Models.Connect;
using Models.Schema.Database;
using Models.Schema.Procedure;
using Models.Schema.Table;
using Models.Schema.View;

namespace MDBNavigator.DAL
{
    public sealed class DBConnection: IAsyncDisposable
    {
        private readonly IDBServerFactory _dbServerFactory;
        IDBServerBase _dbServer= null!;

        private DBConnection(IDBServerFactory dbServerFactory)
        {
            _dbServerFactory = dbServerFactory;
        }

        public async ValueTask DisposeAsync()
        {
            await _dbServer.Disconnect();
            _dbServer = null!;
        }

        public static async Task<DBConnection> CreateConnection(IDBServerFactory dbServerFactory, ConnectionSettings details, string? databaseName = null)
        {
            var instance = new DBConnection(dbServerFactory);
            await instance.Connect(details, databaseName);

            return instance;
        }

        public string DataSource
        {
            get => _dbServer.DataSource;
        }

        private async Task Connect(ConnectionSettings details, string? databaseName = null)
        {
            _dbServer = _dbServerFactory.Create(details);

            await _dbServer.Connect(details, databaseName);
        }

        public async Task<IEnumerable<DatabaseDto>> GetDatabases()
            => await _dbServer.GetDatabases();
        public async Task<IEnumerable<Table>> GetTables()
            => await _dbServer.GetTables();

        public async Task<TableDefinition> GetTableDefinition(string schema, string table)
            => await _dbServer.GetTableDefinition(schema, table);

        public async Task<IEnumerable<ProcedureDto>> GetStoredProcedures()
            => await _dbServer.GetStoredProcedures();
        public string GetCreateStoredProcedureScript(string schema)
            => _dbServer.GetCreateStoredProcedureScript(schema);

        public async Task<IEnumerable<ProcedureDto>> GetFunctions()
            => await _dbServer.GetFunctions();
        public string GetCreateFunctionProcedureScript(string schema)
            => _dbServer.GetCreateFunctionProcedureScript(schema);

        public async Task<string> GetProcedureDefinition(string schema, string name)
            => await _dbServer.GetProcedureDefinition(schema, name);

        public string GetDropProcedureScript(string schema, string name)
            => _dbServer.GetDropProcedureScript(schema, name);

        public async Task<IEnumerable<ViewDto>> GetViews()
            => await _dbServer.GetViews();

        public async Task<string> GetViewDefinition(string schema, string name)
            => await _dbServer.GetViewDefinition(schema, name);
        public string GetCreateViewScript(string schema)
            => _dbServer.GetCreateViewScript(schema);
        public  string GetDropViewScript(string schema, string name)
            => _dbServer.GetDropViewScript(schema, name);

        public async Task<DatabaseSingleCommandResultRaw> GetTopNTableRecords(string schema, string table, int? recordsNumber)
            => await _dbServer.GetTopNTableRecords(schema, table, recordsNumber);

        public string GetTopNTableRecordsScript(string schema, string table, int? recordsNumber)
            => _dbServer.GetTopNTableRecordsScript(schema, table, recordsNumber);
        public string GetCreateNewTableScript(string schema)
          => _dbServer.GetCreateNewTableScript(schema);
        public async Task<string> GetCreateTableScript(string schema, string table)
          => await _dbServer.GetCreateTableScript(schema, table);
        public string GetDropTableScript(string schema, string table)
          => _dbServer.GetDropTableScript(schema, table);
        public async Task<string> GetInsertTableScript(string schema, string table)
            => await _dbServer.GetInsertTableScript(schema, table);

        public async Task<DatabaseSingleCommandResultRaw> ExecuteSingleQuery(string cmdQuery)
            => await _dbServer.ExecuteSingleQuery(cmdQuery);

        public async Task<DatabaseCommandResultRaw> ExecuteQuery(string cmdQuery)
            => await _dbServer.ExecuteQuery(cmdQuery);
    }
}
