using Dapper;
using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.DTOs.Command;
using MDBNavigator.Domain.Schema.Database;
using MDBNavigator.Domain.Schema.Procedure;
using MDBNavigator.Domain.Schema.Table;
using MDBNavigator.Domain.Schema.View;
using MDBNavigator.Domain.Exceptions;
using MDBNavigator.Domain.ValueObjects;
using MDBNavigator.Infrastructure.PostgreSQL.Models;
using Npgsql;
using System.Runtime.CompilerServices;

namespace MDBNavigator.Infrastructure.PostgreSQL
{
    public class PostgreSQLServer : IDatabaseProvider
    {
        NpgsqlConnection _connection = null!;

        // Functions ('f') and procedures ('p'); aggregates/window functions have no editable definition.
        private const string RoutineKinds = "('f', 'p')";

        // Always schema-qualified, unlike regclass output (which drops schemas on the search_path).
        // Expects pg_class c and pg_namespace n in the query.
        private const string QualifiedRelationSql = "quote_ident(n.nspname) || '.' || quote_ident(c.relname)";

        public string DataSource => _connection.DataSource;

        public async ValueTask DisposeAsync() => await DisconnectAsync();

        internal async Task ConnectAsync(ConnectionSettings settings, string? databaseName = null, CancellationToken ct = default)
        {
            var builder = new NpgsqlConnectionStringBuilder
            {
                Host = settings.ServerName,
                Username = settings.UserName,
                Password = settings.Password,
                // Npgsql hides the server's error DETAIL by default (it may contain row values). In a database
                // tool the user is the database user, and the detail is what explains the error
                // (e.g. which objects block a DROP), so it is shown.
                IncludeErrorDetail = true,
            };

            if (settings.Port > 0) builder.Port = settings.Port;
            if (!string.IsNullOrEmpty(databaseName)) builder.Database = databaseName;

            _connection = new NpgsqlConnection(builder.ConnectionString);
            try
            {
                await _connection.OpenAsync(ct);
            }
            catch
            {
                await DisconnectAsync();
                throw;
            }
        }

        private async Task DisconnectAsync()
        {
            if (_connection is null)
            {
                return;
            }
            await _connection.DisposeAsync();
            _connection = null!;
        }

        public async Task<IEnumerable<DbDatabase>> GetDatabases(CancellationToken ct = default)
            => await _connection.QueryAsync<DbDatabase>(Command(
                "SELECT oid AS InternalId, datname AS Name FROM pg_database WHERE datistemplate = false ORDER BY oid DESC;", ct: ct));

        public async Task<IEnumerable<DbTable>> GetTables(CancellationToken ct = default)
            => await _connection.QueryAsync<DbTable>(Command(
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

            var multi = await _connection.QueryMultipleAsync(Command(query, new { Schema = schema, Table = table }, ct));
            return new TableDefinition
            {
                Columns = await multi.ReadAsync<TableColumn>(),
                Indexes = await multi.ReadAsync<TableIndex>(),
                Constraints = await multi.ReadAsync<TableConstraint>()
            };
        }

        public async Task<IEnumerable<DbProcedure>> GetStoredProcedures(CancellationToken ct = default) => await GetProceduresInternal("PROCEDURE", ct);

        public string GetCreateStoredProcedureScript(string schema)
        {
            var template = @"CREATE OR REPLACE PROCEDURE {0}.MyProcName(p_id INT, INOUT p_status VARCHAR(255))
LANGUAGE plpgsql AS $$
DECLARE v_timestamp TIMESTAMP := NOW();
BEGIN
    UPDATE {0}.orders SET processed_at = v_timestamp WHERE id = p_id;
    p_status := 'SUCCESS';
END;
$$;";
            return string.Format(template, QuoteIdentifier(schema, nameof(schema)));
        }

        public async Task<IEnumerable<DbProcedure>> GetFunctions(CancellationToken ct = default) => await GetProceduresInternal("FUNCTION", ct);

        public string GetCreateFunctionProcedureScript(string schema)
        {
            var template = @"CREATE OR REPLACE FUNCTION {0}.MyFuncName(p_id INT)
RETURNS VARCHAR(255) LANGUAGE plpgsql AS $$
DECLARE v_status VARCHAR(255);
BEGIN
    v_status := 'SUCCESS';
    RETURN v_status;
END;
$$;";
            return string.Format(template, QuoteIdentifier(schema, nameof(schema)));
        }

        // Overloads share a name, so the definitions of all of them are returned (one statement each).
        public async Task<string> GetProcedureDefinition(string schema, string name, CancellationToken ct = default)
        {
            var definitions = (await _connection.QueryAsync<string>(Command(
                $@"SELECT pg_get_functiondef(p.oid)
                   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                   WHERE n.nspname = @Schema AND p.proname = @Name AND p.prokind IN {RoutineKinds}
                   ORDER BY p.oid",
                new { Schema = schema, Name = name }, ct))).ToList();

            if (definitions.Count == 0)
            {
                throw new ObjectNotFoundException($"Routine {schema}.{name} was not found.");
            }

            return string.Join("\n\n", definitions.Select(d => d.TrimEnd() + ";"));
        }

        // One DROP per overload, with the right keyword and the argument types that identify it.
        public async Task<string> GetDropProcedureScript(string schema, string name, CancellationToken ct = default)
        {
            var qualifiedName = QualifiedName(schema, name);
            var routines = (await _connection.QueryAsync<(string Kind, string Arguments)>(Command(
                $@"SELECT p.prokind::text AS Kind, pg_get_function_identity_arguments(p.oid) AS Arguments
                   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                   WHERE n.nspname = @Schema AND p.proname = @Name AND p.prokind IN {RoutineKinds}
                   ORDER BY p.oid",
                new { Schema = schema, Name = name }, ct))).ToList();

            if (routines.Count == 0)
            {
                throw new ObjectNotFoundException($"Routine {schema}.{name} was not found.");
            }

            return string.Join("\n", routines.Select(r =>
                $"DROP {(r.Kind == "p" ? "PROCEDURE" : "FUNCTION")} {qualifiedName}({r.Arguments});"));
        }

        public async Task<IEnumerable<DbView>> GetViews(CancellationToken ct = default)
            => await _connection.QueryAsync<DbView>(Command(
                "SELECT table_schema AS DatabaseSchema, table_name AS Name " +
                "FROM information_schema.tables " +
                "WHERE table_schema NOT IN ('pg_catalog', 'information_schema') AND table_type = 'VIEW' " +
                "ORDER BY table_schema", ct: ct));

        // pg_get_viewdef also works for views the user doesn't own (information_schema.views hides those).
        public async Task<string> GetViewDefinition(string schema, string name, CancellationToken ct = default)
        {
            var definition = await _connection.QueryFirstOrDefaultAsync<string?>(Command(
                $@"SELECT 'CREATE OR REPLACE VIEW ' || {QualifiedRelationSql} || ' AS' || E'\n' || pg_get_viewdef(c.oid, true)
                  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                  WHERE c.relkind = 'v' AND n.nspname = @Schema AND c.relname = @Name",
                new { Schema = schema, Name = name }, ct));

            return definition ?? throw new ObjectNotFoundException($"View {schema}.{name} was not found.");
        }

        public string GetCreateViewScript(string schema)
            => string.Format(@"CREATE OR REPLACE VIEW {0}.MyView AS
SELECT -- columns
FROM   -- tables
WHERE  -- conditions", QuoteIdentifier(schema, nameof(schema)));

        public string GetDropViewScript(string schema, string name)
            => $"DROP VIEW {QualifiedName(schema, name)};";

        public string GetTopNTableRecordsScript(string schema, string table, int? recordsNumber)
        {
            var script = $"SELECT * FROM {QualifiedName(schema, table)}";
            if (recordsNumber.HasValue && recordsNumber.Value > -1)
            {
                script += $" LIMIT {recordsNumber}";
            }
            return script;
        }

        public string GetCreateNewTableScript(string schema)
            => $"CREATE TABLE {QuoteIdentifier(schema, nameof(schema))}.\"MyTable\"\r\n(\r\n    \"Id\" integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 ),\r\n    CONSTRAINT \"PK_MyTable_Id\" PRIMARY KEY (\"Id\")\r\n);";

        public async Task<string> GetCreateTableScript(string schema, string table, CancellationToken ct = default)
        {
            const string sql = $@"SELECT
    'CREATE TABLE ' || {QualifiedRelationSql} || ' (' || E'\n' ||
    (SELECT string_agg('    ' || quote_ident(a.attname) || ' ' || format_type(a.atttypid, a.atttypmod) ||
        CASE WHEN a.attnotnull THEN ' NOT NULL' ELSE '' END, E',\n')
     FROM pg_attribute a WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped) || E'\n' || ');' || E'\n\n' ||
    COALESCE((SELECT string_agg(pg_get_indexdef(i.indexrelid) || ';', E'\n') FROM pg_index i WHERE i.indrelid = c.oid), '') || E'\n\n' ||
    COALESCE((SELECT string_agg('ALTER TABLE ' || {QualifiedRelationSql} || ' ADD ' || pg_get_constraintdef(con.oid) || ';', E'\n')
              FROM pg_constraint con WHERE con.conrelid = c.oid), '') AS full_ddl
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = @Table AND n.nspname = @Schema;";
            return await GetTableScript(sql, schema, table, ct);
        }

        public string GetDropTableScript(string schema, string table)
            => $"DROP TABLE {QualifiedName(schema, table)};";

        public async Task<string> GetInsertTableScript(string schema, string table, CancellationToken ct = default)
        {
            const string sql = $@"SELECT
'INSERT INTO ' || {QualifiedRelationSql} || ' (' ||
(SELECT string_agg(quote_ident(a.attname), ', ') FROM pg_attribute a WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped) || ')
VALUES (' ||
(SELECT string_agg('DEFAULT', ', ') FROM pg_attribute a WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped) || ');' AS insert_ddl
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = @Table AND n.nspname = @Schema;";
            return await GetTableScript(sql, schema, table, ct);
        }

        public async IAsyncEnumerable<QueryBatch> StreamQuery(
            string cmdQuery,
            int batchSize,
            object? parameters = null,
            int? commandTimeoutSeconds = null,
            int? maxRows = null,
            QueryStreamStats? stats = null,
            [EnumeratorCancellation] CancellationToken ct = default)
        {
            long totalRows = 0;
            var limitReached = false;

            await using var command = new NpgsqlCommand(cmdQuery, _connection);
            if (commandTimeoutSeconds.HasValue)
            {
                command.CommandTimeout = commandTimeoutSeconds.Value;
            }
            if (parameters != null)
            {
                foreach (var prop in parameters.GetType().GetProperties())
                    command.Parameters.AddWithValue(prop.Name, prop.GetValue(parameters) ?? DBNull.Value);
            }
            await using var reader = await command.ExecuteReaderAsync(ct);

            var resultSetIndex = 0;
            do
            {
                if (reader.FieldCount == 0)
                {
                    resultSetIndex++;
                    continue;
                }

                var columns = Enumerable.Range(0, reader.FieldCount)
                    .Select(i => new ColumnInfo(
                        reader.GetName(i),
                        reader.GetFieldType(i).Name,
                        reader.GetFieldType(i).FullName ?? reader.GetFieldType(i).Name))
                    .ToArray();

                var batchRows = new List<object?[]>(batchSize);
                var batchIndex = 0;
                var isFirstBatch = true;

                while (await reader.ReadAsync(ct))
                {
                    var row = new object?[reader.FieldCount];
                    for (int i = 0; i < reader.FieldCount; i++)
                        row[i] = reader.IsDBNull(i) ? null : JsonCellValue.From(reader.GetValue(i));
                    batchRows.Add(row);
                    totalRows++;
                    if (stats != null) stats.RowCount++;

                    if (maxRows.HasValue && totalRows >= maxRows.Value)
                    {
                        limitReached = true;
                        break;
                    }

                    if (batchRows.Count == batchSize)
                    {
                        yield return new QueryBatch
                        {
                            ResultSetIndex = resultSetIndex,
                            IsFirstBatch = isFirstBatch,
                            IsLastBatch = false,
                            BatchIndex = batchIndex,
                            Columns = isFirstBatch ? columns : null,
                            Rows = batchRows.ToArray()
                        };
                        isFirstBatch = false;
                        batchIndex++;
                        batchRows.Clear();
                    }
                }

                yield return new QueryBatch
                {
                    ResultSetIndex = resultSetIndex,
                    IsFirstBatch = isFirstBatch,
                    IsLastBatch = true,
                    BatchIndex = batchIndex,
                    Columns = isFirstBatch ? columns : null,
                    Rows = batchRows.ToArray()
                };

                if (limitReached)
                {
                    if (stats != null) stats.Truncated = true;
                    await StopReaderAsync(command, reader);
                    yield break;
                }

                resultSetIndex++;
            }
            while (await reader.NextResultAsync(ct));

            if (stats != null) stats.RecordsAffected = reader.RecordsAffected;
        }

        // Dapper command carrying the request's cancellation token.
        private static CommandDefinition Command(string sql, object? parameters = null, CancellationToken ct = default)
            => new(sql, parameters, cancellationToken: ct);

        private async Task<IEnumerable<DbProcedure>> GetProceduresInternal(string type, CancellationToken ct)
        {
            // DISTINCT: overloads are listed once; their definitions/drop scripts cover all overloads.
            var raw = await _connection.QueryAsync<ProcedureRaw>(Command(
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
                    "FUNCTION" => Domain.Schema.Procedure.ProcedureType.Function,
                    "PROCEDURE" => Domain.Schema.Procedure.ProcedureType.Procedure,
                    _ => Domain.Schema.Procedure.ProcedureType.Unknown
                }
            });
        }

        private async Task<string> GetTableScript(string sql, string schema, string table, CancellationToken ct)
        {
            // The script is the first column of the first row; no row means the table doesn't exist.
            var script = await _connection.ExecuteScalarAsync<string?>(Command(sql, new { Schema = schema, Table = table }, ct));
            return script ?? throw new ObjectNotFoundException($"Table {schema}.{table} was not found.");
        }

        // Disposing a reader reads all remaining rows, so the command is cancelled server-side first.
        // The resulting "query canceled" error is expected and swallowed.
        private static async Task StopReaderAsync(NpgsqlCommand command, NpgsqlDataReader reader)
        {
            try
            {
                command.Cancel();
                await reader.DisposeAsync();
            }
            catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.QueryCanceled)
            {
            }
            catch (OperationCanceledException)
            {
            }
        }

        // PostgreSQL identifier quoting: wrap in double quotes and double any embedded quote.
        // Accepts every valid name (mixed case, spaces, non-ASCII...), keeps its exact case and
        // makes SQL injection through object names impossible.
        private static string QuoteIdentifier(string identifier, string paramName)
        {
            if (string.IsNullOrWhiteSpace(identifier) || identifier.Contains('\0'))
            {
                throw new ArgumentException($"Invalid identifier value for '{paramName}'.", paramName);
            }
            return "\"" + identifier.Replace("\"", "\"\"") + "\"";
        }

        private static string QualifiedName(string schema, string name)
            => $"{QuoteIdentifier(schema, nameof(schema))}.{QuoteIdentifier(name, nameof(name))}";
    }
}
