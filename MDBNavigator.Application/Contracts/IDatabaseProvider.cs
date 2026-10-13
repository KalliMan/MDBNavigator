using MDBNavigator.Application.DTOs.Command;
using MDBNavigator.Domain.Schema.Database;
using MDBNavigator.Domain.Schema.Procedure;
using MDBNavigator.Domain.Schema.Table;
using MDBNavigator.Domain.Schema.View;

namespace MDBNavigator.Application.Contracts
{
    public interface IDatabaseProvider : IAsyncDisposable
    {
        string DataSource { get; }

        Task<IEnumerable<DatabaseDto>> GetDatabases();

        Task<IEnumerable<DbTable>> GetTables();
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
        IAsyncEnumerable<QueryBatch> StreamQuery(string cmdQuery, int batchSize, object? parameters = null, CancellationToken ct = default);
    }
}
