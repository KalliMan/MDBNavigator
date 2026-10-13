using Dapper;
using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.DTOs.Command;
using MDBNavigator.Domain.Schema.Database;
using MDBNavigator.Domain.Schema.Procedure;
using MDBNavigator.Domain.Schema.Table;
using MDBNavigator.Domain.Schema.View;
using MDBNavigator.Domain.ValueObjects;
using MDBNavigator.Infrastructure.PostgreSQL.Models;
using Npgsql;
using System.Data;
using System.Runtime.CompilerServices;
using System.Text.RegularExpressions;

namespace MDBNavigator.Infrastructure.PostgreSQL
{
    public class PostgreSQLServer : IDatabaseProvider
    {
        NpgsqlConnection _connection = null!;

        // Allow common PostgreSQL identifier characters while rejecting dangerous ones
        private static readonly Regex ValidIdentifierRegex = new Regex(@"^[A-Za-z0-9_\[\]\.\- ]+$", RegexOptions.Compiled);

        public string DataSource => _connection.DataSource;

        public async ValueTask DisposeAsync() => await DisconnectAsync();

        internal async Task ConnectAsync(ConnectionSettings settings, string? databaseName = null)
        {
            var builder = new NpgsqlConnectionStringBuilder
            {
                Host = settings.ServerName,
                Username = settings.UserName,
                Password = settings.Password,
            };

            if (settings.Port > 0) builder.Port = settings.Port;
            if (!string.IsNullOrEmpty(databaseName)) builder.Database = databaseName;

            _connection = new NpgsqlConnection(builder.ConnectionString);
            await _connection.OpenAsync();
        }

        private async Task DisconnectAsync()
        {
            await _connection.DisposeAsync();
            _connection = null!;
        }

        public async Task<IEnumerable<DatabaseDto>> GetDatabases()
            => await _connection.QueryAsync<DatabaseDto>(
                "SELECT oid AS InternalId, datname AS Name FROM pg_database WHERE datistemplate = false ORDER BY oid DESC;");

        public async Task<IEnumerable<DbTable>> GetTables()
            => await _connection.QueryAsync<DbTable>(
                @"SELECT TABLE_SCHEMA AS DATABASESCHEMA, TABLE_NAME AS NAME
                  FROM INFORMATION_SCHEMA.TABLES
                  WHERE TABLE_SCHEMA NOT IN ('pg_catalog', 'information_schema')
                    AND TABLE_TYPE = 'BASE TABLE'
                  ORDER BY TABLE_SCHEMA");

        public async Task<TableDefinition> GetTableDefinition(string schema, string table)
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

            var multi = await _connection.QueryMultipleAsync(query, new { Schema = schema, Table = table });
            return new TableDefinition
            {
                Columns = await multi.ReadAsync<TableColumn>(),
                Indexes = await multi.ReadAsync<TableIndex>(),
                Constraints = await multi.ReadAsync<TableConstraint>()
            };
        }

        public async Task<IEnumerable<ProcedureDto>> GetStoredProcedures() => await GetProceduresInternal("PROCEDURE");

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
            return string.Format(template, schema);
        }

        public async Task<IEnumerable<ProcedureDto>> GetFunctions() => await GetProceduresInternal("FUNCTION");

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
            return string.Format(template, schema);
        }

        public async Task<string> GetProcedureDefinition(string schema, string name)
            => await _connection.QueryFirstAsync<string>(
                "SELECT pg_get_functiondef((SELECT pg_proc.oid FROM pg_proc " +
                "JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid " +
                "WHERE proname = @Name AND nspname = @Schema));",
                new { Name = name, Schema = schema });

        public string GetDropProcedureScript(string schema, string name)
        {
            schema = EnsureValidIdentifier(schema, nameof(schema));
            name = EnsureValidIdentifier(name, nameof(name));
            return $"DROP PROCEDURE {schema}.{name};";
        }

        public async Task<IEnumerable<ViewDto>> GetViews()
            => await _connection.QueryAsync<ViewDto>(
                "SELECT table_schema AS DatabaseSchema, table_name AS Name " +
                "FROM information_schema.tables " +
                "WHERE table_schema NOT IN ('pg_catalog', 'information_schema') AND table_type = 'VIEW' " +
                "ORDER BY table_schema");

        public async Task<string> GetViewDefinition(string schema, string name)
            => await _connection.QueryFirstAsync<string>(
                "SELECT 'CREATE OR REPLACE VIEW ' || table_name || ' AS ' || view_definition " +
                "FROM information_schema.views WHERE table_name = @ViewName AND table_schema = @Schema;",
                new { Schema = schema, ViewName = name });

        public string GetCreateViewScript(string schema)
            => string.Format(@"CREATE OR REPLACE VIEW {0}.MyView AS
SELECT -- columns
FROM   -- tables
WHERE  -- conditions", schema);

        public string GetDropViewScript(string schema, string name)
        {
            schema = EnsureValidIdentifier(schema, nameof(schema));
            name = EnsureValidIdentifier(name, nameof(name));
            return $"DROP VIEW {schema}.{name};";
        }

        public async Task<DatabaseSingleCommandResultRaw> GetTopNTableRecords(string schema, string table, int? recordsNumber)
        {
            schema = EnsureValidIdentifier(schema, nameof(schema));
            table = EnsureValidIdentifier(table, nameof(table));
            var sql = $"SELECT * FROM {schema}.{table}";
            return recordsNumber.HasValue && recordsNumber.Value > -1
                ? await ExecuteSingleQuery(sql + " LIMIT @Limit", new { Limit = recordsNumber.Value })
                : await ExecuteSingleQuery(sql);
        }

        public string GetTopNTableRecordsScript(string schema, string table, int? recordsNumber)
        {
            schema = EnsureValidIdentifier(schema, nameof(schema));
            table = EnsureValidIdentifier(table, nameof(table));
            var script = $"SELECT * FROM {schema}.\"{table}\" ";
            if (recordsNumber.HasValue && recordsNumber.Value > -1)
            {
                script += $"LIMIT {recordsNumber}";
            }
            return script;
        }

        public string GetCreateNewTableScript(string schema)
        {
            schema = EnsureValidIdentifier(schema, nameof(schema));
            return $"CREATE TABLE {schema}.\"MyTable\"\r\n(\r\n    \"Id\" integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 ),\r\n    CONSTRAINT \"PK_[MyTable]_Id\" PRIMARY KEY (\"Id\")\r\n);";
        }

        public async Task<string> GetCreateTableScript(string schema, string table)
        {
            schema = EnsureValidIdentifier(schema, nameof(schema));
            table = EnsureValidIdentifier(table, nameof(table));
            var sql = string.Format(@"SELECT 
    'CREATE TABLE ' || regclass(c.oid) || ' (' || E'\n' ||
    (SELECT string_agg('    ' || quote_ident(a.attname) || ' ' || format_type(a.atttypid, a.atttypmod) ||
        CASE WHEN a.attnotnull THEN ' NOT NULL' ELSE '' END, E',\n')
     FROM pg_attribute a WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped) || E'\n' || ');' || E'\n\n' ||
    COALESCE((SELECT string_agg(pg_get_indexdef(i.indexrelid) || ';', E'\n') FROM pg_index i WHERE i.indrelid = c.oid), '') || E'\n\n' ||
    COALESCE((SELECT string_agg('ALTER TABLE ' || quote_ident(c.relname) || ' ADD ' || pg_get_constraintdef(con.oid) || ';', E'\n')
              FROM pg_constraint con WHERE con.conrelid = c.oid), '') AS full_ddl
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = '{0}' AND n.nspname = '{1}';", table, schema);
            return await GetTableScript(sql);
        }

        public string GetDropTableScript(string schema, string table)
        {
            schema = EnsureValidIdentifier(schema, nameof(schema));
            table = EnsureValidIdentifier(table, nameof(table));
            return $"DROP TABLE {schema}.\"{table}\"";
        }

        public async Task<string> GetInsertTableScript(string schema, string table)
        {
            schema = EnsureValidIdentifier(schema, nameof(schema));
            table = EnsureValidIdentifier(table, nameof(table));
            var sql = string.Format(@"SELECT 
'INSERT INTO ' || regclass(c.oid) || ' (' ||
(SELECT string_agg(quote_ident(a.attname), ', ') FROM pg_attribute a WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped) || ')
VALUES (' ||
(SELECT string_agg('DEFAULT', ', ') FROM pg_attribute a WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped) || ');' AS insert_ddl
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = '{0}' AND n.nspname = '{1}';", table, schema);
            return await GetTableScript(sql);
        }

        public async Task<DatabaseSingleCommandResultRaw> ExecuteSingleQuery(string cmdQuery, object? parameters = null)
        {
            using var reader = await _connection.ExecuteReaderAsync(cmdQuery, parameters);
            var dt = new DataTable();
            if (reader.HasRows) dt.Load(reader);
            return new DatabaseSingleCommandResultRaw { RecordsAffected = reader.RecordsAffected, Result = dt };
        }

        public async IAsyncEnumerable<QueryBatch> StreamQuery(string cmdQuery, int batchSize, object? parameters = null, [EnumeratorCancellation] CancellationToken ct = default)
        {
            await using var command = new NpgsqlCommand(cmdQuery, _connection);
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
                        row[i] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                    batchRows.Add(row);

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

                resultSetIndex++;
            }
            while (await reader.NextResultAsync(ct));
        }

        private async Task<IEnumerable<ProcedureDto>> GetProceduresInternal(string type)
        {
            var raw = await _connection.QueryAsync<ProcedureRaw>(
                "SELECT routine_schema As DatabaseSchema, routine_name As Name, routine_type AS ProcedureType " +
                "FROM information_schema.routines " +
                "WHERE routine_schema NOT IN ('pg_catalog', 'information_schema') AND routine_type = @Type " +
                "ORDER BY routine_schema",
                new { Type = type });

            return raw.Select(p => new ProcedureDto
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

        private async Task<string> GetTableScript(string sql)
        {
            var raw = await ExecuteSingleQuery(sql);
            if (raw.Result.Rows.Count > 0 && raw.Result.Columns.Count > 0)
            {
                return raw.Result.Rows[0][0]?.ToString() ?? string.Empty;
            }
            return string.Empty;
        }

        private static string EnsureValidIdentifier(string identifier, string paramName)
        {
            if (string.IsNullOrWhiteSpace(identifier) || !ValidIdentifierRegex.IsMatch(identifier))
            {
                throw new ArgumentException($"Invalid identifier value for '{paramName}'.", paramName);
            }
            return identifier;
        }
    }
}
