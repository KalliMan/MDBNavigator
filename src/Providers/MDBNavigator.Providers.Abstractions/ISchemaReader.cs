using MDBNavigator.Providers.Abstractions.Schema;

namespace MDBNavigator.Providers.Abstractions
{
    // What the tree shows. Async members take the request's CancellationToken, so an abandoned request stops its database call.
    public interface ISchemaReader
    {
        Task<IEnumerable<DbDatabase>> GetDatabases(CancellationToken ct = default);

        Task<IEnumerable<DbTable>> GetTables(CancellationToken ct = default);
        Task<TableDefinition> GetTableDefinition(string schema, string table, CancellationToken ct = default);

        Task<IEnumerable<DbProcedure>> GetStoredProcedures(CancellationToken ct = default);
        Task<IEnumerable<DbProcedure>> GetFunctions(CancellationToken ct = default);

        Task<IEnumerable<DbView>> GetViews(CancellationToken ct = default);
    }
}
