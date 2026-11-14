using Dapper;
using MDBNavigator.Providers.Abstractions;
using MDBNavigator.Providers.Abstractions.Schema;
using MDBNavigator.Providers.PostgreSQL.Models;
using Npgsql;

namespace MDBNavigator.Providers.PostgreSQL
{
    internal sealed class PostgresSchemaReader : ISchemaReader
    {
        private readonly NpgsqlConnection _connection;

        public PostgresSchemaReader(NpgsqlConnection connection)
        {
            _connection = connection;
        }

        public async Task<IEnumerable<DbDatabase>> GetDatabases(CancellationToken ct = default)
            => await _connection.QueryAsync<DbDatabase>(PostgresCommands.Command(
                "SELECT oid AS InternalId, datname AS Name FROM pg_database WHERE datistemplate = false ORDER BY oid DESC;", ct: ct));

        public async Task<IEnumerable<DbTable>> GetTables(CancellationToken ct = default)
            => await _connection.QueryAsync<DbTable>(PostgresCommands.Command(
                @"SELECT TABLE_SCHEMA AS DATABASESCHEMA, TABLE_NAME AS NAME
                  FROM INFORMATION_SCHEMA.TABLES
                  WHERE TABLE_SCHEMA NOT IN ('pg_catalog', 'information_schema')
                    AND TABLE_TYPE = 'BASE TABLE'
                  ORDER BY TABLE_SCHEMA", ct: ct));

        public async Task<TableDefinition> GetTableDefinition(string schema, string table, CancellationToken ct = default)
        {
            var query = @"
SELECT COLUMN_NAME AS ColumnName, DATA_TYPE AS DataType,
       CASE WHEN IS_NULLABLE = 'YES' THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS ISNULLABLE,
       CHARACTER_MAXIMUM_LENGTH AS MAXLENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @SCHEMA AND TABLE_NAME = @TABLE ORDER BY ORDINAL_POSITION;

SELECT I.RELNAME AS IndexName,
       IDX.INDISUNIQUE AS IsUnique,
       CASE WHEN C.CONTYPE = 'p' THEN 2
            WHEN C.CONTYPE = 'u' THEN 3
            WHEN IDX.INDISUNIQUE THEN 1
            ELSE 0
       END AS IndexType
FROM PG_INDEX IDX
JOIN PG_CLASS I ON I.OID = IDX.INDEXRELID
JOIN PG_CLASS T ON T.OID = IDX.INDRELID
JOIN PG_NAMESPACE N ON N.OID = T.RELNAMESPACE
LEFT JOIN LATERAL (
    SELECT CONTYPE FROM PG_CONSTRAINT
    WHERE CONINDID = I.OID
    ORDER BY CASE WHEN CONTYPE = 'p' THEN 0 WHEN CONTYPE = 'u' THEN 1 ELSE 2 END
    LIMIT 1
) C ON TRUE
WHERE N.NSPNAME = @SCHEMA AND T.RELNAME = @TABLE;

SELECT con.conname AS ConstraintName,
       CASE con.contype WHEN 'p' THEN 'PRIMARY KEY' WHEN 'f' THEN 'FOREIGN KEY'
                        WHEN 'u' THEN 'UNIQUE' WHEN 'c' THEN 'CHECK'
                        WHEN 'n' THEN 'NOT NULL' ELSE 'OTHER' END AS ConstraintType
FROM pg_catalog.pg_constraint con
JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
JOIN pg_catalog.pg_namespace nsp ON nsp.oid = con.connamespace
WHERE nsp.nspname = @SCHEMA AND rel.relname = @TABLE;";

            var multi = await _connection.QueryMultipleAsync(PostgresCommands.Command(query, new { Schema = schema, Table = table }, ct));
            return new TableDefinition
            {
                Columns = await multi.ReadAsync<TableColumn>(),
                Indexes = await multi.ReadAsync<TableIndex>(),
                Constraints = await multi.ReadAsync<TableConstraint>()
            };
        }

        public async Task<IEnumerable<DbProcedure>> GetStoredProcedures(CancellationToken ct = default) => await GetProceduresInternal("PROCEDURE", ct);

        public async Task<IEnumerable<DbProcedure>> GetFunctions(CancellationToken ct = default) => await GetProceduresInternal("FUNCTION", ct);

        public async Task<IEnumerable<DbView>> GetViews(CancellationToken ct = default)
            => await _connection.QueryAsync<DbView>(PostgresCommands.Command(
                "SELECT table_schema AS DatabaseSchema, table_name AS Name " +
                "FROM information_schema.tables " +
                "WHERE table_schema NOT IN ('pg_catalog', 'information_schema') AND table_type = 'VIEW' " +
                "ORDER BY table_schema", ct: ct));

        private async Task<IEnumerable<DbProcedure>> GetProceduresInternal(string type, CancellationToken ct)
        {
            // DISTINCT: overloads are listed once; their definitions/drop scripts cover all overloads.
            var raw = await _connection.QueryAsync<ProcedureRaw>(PostgresCommands.Command(
                "SELECT DISTINCT routine_schema As DatabaseSchema, routine_name As Name, routine_type AS ProcedureType " +
                "FROM information_schema.routines " +
                "WHERE routine_schema NOT IN ('pg_catalog', 'information_schema') AND routine_type = @Type " +
                "ORDER BY routine_schema, routine_name",
                new { Type = type }, ct));

            return raw.Select(p => new DbProcedure
            {
                DatabaseSchema = p.DatabaseSchema,
                Name = p.Name,
                ProcedureType = p.ProcedureType switch
                {
                    "FUNCTION" => ProcedureType.Function,
                    "PROCEDURE" => ProcedureType.Procedure,
                    _ => ProcedureType.Unknown
                }
            });
        }
    }
}
