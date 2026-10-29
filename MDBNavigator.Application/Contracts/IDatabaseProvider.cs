using MDBNavigator.Application.DTOs.Command;
using MDBNavigator.Domain.Schema.Database;
using MDBNavigator.Domain.Schema.Procedure;
using MDBNavigator.Domain.Schema.Table;
using MDBNavigator.Domain.Schema.View;

namespace MDBNavigator.Application.Contracts
{
    // Async members take the request's CancellationToken, so an abandoned request stops its database call.
    public interface IDatabaseProvider : IAsyncDisposable
    {
        string DataSource { get; }

        Task<IEnumerable<DatabaseDto>> GetDatabases(CancellationToken ct = default);

        Task<IEnumerable<DbTable>> GetTables(CancellationToken ct = default);
        Task<TableDefinition> GetTableDefinition(string schema, string table, CancellationToken ct = default);

        Task<IEnumerable<ProcedureDto>> GetStoredProcedures(CancellationToken ct = default);
        string GetCreateStoredProcedureScript(string schema);

        Task<IEnumerable<ProcedureDto>> GetFunctions(CancellationToken ct = default);
        string GetCreateFunctionProcedureScript(string schema);

        Task<string> GetProcedureDefinition(string schema, string name, CancellationToken ct = default);
        Task<string> GetDropProcedureScript(string schema, string name, CancellationToken ct = default);

        Task<IEnumerable<ViewDto>> GetViews(CancellationToken ct = default);
        Task<string> GetViewDefinition(string schema, string name, CancellationToken ct = default);
        string GetCreateViewScript(string schema);
        string GetDropViewScript(string schema, string name);

        string GetTopNTableRecordsScript(string schema, string table, int? recordsNumber);
        string GetCreateNewTableScript(string schema);
        Task<string> GetCreateTableScript(string schema, string table, CancellationToken ct = default);
        string GetDropTableScript(string schema, string table);
        Task<string> GetInsertTableScript(string schema, string table, CancellationToken ct = default);

        // commandTimeoutSeconds: null keeps the provider default, 0 means no timeout.
        // maxRows: stop (and cancel the command) once this many rows were read across all result sets.
        // stats is filled while the stream is consumed (row count, records affected, truncated).
        IAsyncEnumerable<QueryBatch> StreamQuery(
            string cmdQuery,
            int batchSize,
            object? parameters = null,
            int? commandTimeoutSeconds = null,
            int? maxRows = null,
            QueryStreamStats? stats = null,
            CancellationToken ct = default);
    }
}
