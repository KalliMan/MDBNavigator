using Dapper;
using MDBNavigator.DAL.Interfaces;
using MDBNavigator.PostgreSQL.Modes;
using Models.Command;
using Models.Connect;
using Models.Schema.Database;
using Models.Schema.Procedure;
using Models.Schema.Table;
using Models.Schema.View;
using Npgsql;
using System.Data;
using System.Text.RegularExpressions;
using static Dapper.SqlMapper;

namespace MDBNavigator.PostgreSQL
{
    public class PostgreSQLServer : IDBServerBase
    {
        NpgsqlConnection _connection = null!;

        // Allow common PostgreSQL identifier characters (letters, digits, underscore, brackets, dot, dash, space)
        // while still rejecting dangerous characters like double quotes or semicolons.
        private static readonly Regex ValidIdentifierRegex = new Regex(@"^[A-Za-z0-9_\[\]\.\- ]+$", RegexOptions.Compiled);

        public string DataSource
        {
            get => _connection.DataSource;
        }

        public async ValueTask DisposeAsync()
        {
            await Disconnect();
        }

        public async Task Connect(ConnectionSettings settings, string? databaseName = null)
        {
            try
            {
                var builder = new NpgsqlConnectionStringBuilder
                {
                    Host = settings.ServerName,
                    Username = settings.UserName,
                    Password = settings.Password,
                };

                if (settings.Port > 0)
                {
                    builder.Port = settings.Port;
                }

                if (!string.IsNullOrEmpty(databaseName))
                {
                    builder.Database = databaseName;
                }

                _connection = new NpgsqlConnection(builder.ConnectionString);
                await _connection.OpenAsync();
            }
            catch (Exception ex)
            {
                throw new Exception("Failed to connect to PostgreSQL.", ex);
            }
        }

        public async Task Disconnect()
        {
            await _connection.DisposeAsync();
            _connection = null!;
        }

        public async Task<IEnumerable<DatabaseDto>> GetDatabases()
            => await _connection.QueryAsync<DatabaseDto>("SELECT oid AS InternalId, datname AS Name FROM pg_database WHERE datistemplate = false ORDER BY oid DESC;");

        public async Task<IEnumerable<Table>> GetTables()
        {
            var tablesQuery = @"
SELECT
	TABLE_SCHEMA AS DATABASESCHEMA,
	TABLE_NAME AS NAME
FROM
	INFORMATION_SCHEMA.TABLES
WHERE
	TABLE_SCHEMA NOT IN ('pg_catalog', 'information_schema')
	AND TABLE_TYPE = 'BASE TABLE'
ORDER BY
	TABLE_SCHEMA";

            return await _connection.QueryAsync<Table>(tablesQuery);
        }

        public async Task<TableDefinition> GetTableDefinition(string schema, string table)
        {
            var query =
                @"
SELECT
	COLUMN_NAME AS ColumnName,
	DATA_TYPE AS DataType,
	CASE
		WHEN IS_NULLABLE = 'YES' THEN CAST(1 AS BIT)
		ELSE CAST(0 AS BIT)
	END AS ISNULLABLE,
	CHARACTER_MAXIMUM_LENGTH AS MAXLENGTH
FROM
	INFORMATION_SCHEMA.COLUMNS
WHERE
	TABLE_SCHEMA = @SCHEMA
	AND TABLE_NAME = @TABLE
ORDER BY
	ORDINAL_POSITION;


SELECT
    I.RELNAME AS IndexName,
    CASE 
        WHEN IDX.INDISUNIQUE THEN 1
        ELSE 0
    END AS IsUnique
FROM
    PG_INDEX IDX
    JOIN PG_CLASS I ON I.OID = IDX.INDEXRELID
    JOIN PG_CLASS T ON T.OID = IDX.INDRELID
    JOIN PG_NAMESPACE N ON N.OID = T.RELNAMESPACE
    LEFT JOIN PG_CONSTRAINT C ON C.CONINDID = I.OID
WHERE
    N.NSPNAME = @SCHEMA
    AND T.RELNAME = @TABLE
    AND C.OID IS NULL;

SELECT
    con.conname AS ConstraintName,
    CASE con.contype
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'u' THEN 'UNIQUE'
        WHEN 'c' THEN 'CHECK'
        WHEN 'x' THEN 'EXCLUSION'
        WHEN 't' THEN 'TRIGGER'
    END AS ConstraintType
FROM pg_catalog.pg_constraint con
JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
JOIN pg_catalog.pg_namespace nsp ON nsp.oid = con.connamespace
WHERE nsp.nspname = @SCHEMA
  AND rel.relname = @TABLE;
";

            var tableDefinitionRaw = await _connection.QueryMultipleAsync(query, new
            {
                Schema = schema,
                Table = table
            });

            var columns = await tableDefinitionRaw.ReadAsync<TableColumn>();
            var indexes = await tableDefinitionRaw.ReadAsync<TableIndex>();
            var constraints = await tableDefinitionRaw.ReadAsync<TableConstraint>();

            return new()
            {
                Columns = columns,
                Indexes = indexes,
                Constraints = constraints
            };
        }

        public async Task<IEnumerable<ProcedureDto>> GetStoredProcedures()
            => await GetProcedures("PROCEDURE");

        public string GetCreateStoredProcedureScript(string schema)
        {
            string result =
 @"CREATE OR REPLACE PROCEDURE {0}.MyProcName(
    p_id INT,
    INOUT p_status VARCHAR(255)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_timestamp TIMESTAMP := NOW();
BEGIN
    UPDATE {0}.orders SET processed_at = v_timestamp WHERE id = p_id;

    p_status := 'SUCCESS';

    RAISE NOTICE 'Procedure executed at %', v_timestamp;
END;
$$;";
            return string.Format(result, schema,  "VARCHAR");
        }


        public async Task<IEnumerable<ProcedureDto>> GetFunctions()
            => await GetProcedures("FUNCTION");

        public string GetCreateFunctionProcedureScript(string schema)
        {
            string result =
@"CREATE OR REPLACE FUNCTION {0}.MyFuncName(p_id INT)
RETURNS VARCHAR(255)
LANGUAGE plpgsql
AS $$
DECLARE
    v_status VARCHAR(255);
    v_timestamp TIMESTAMP := NOW();
BEGIN
    UPDATE {0}.orders SET processed_at = v_timestamp WHERE id = p_id;
    v_status := 'SUCCESS';
    RAISE NOTICE 'Function executed at %', v_timestamp;
    RETURN v_status;
END;
$$;";
            return string.Format(result, schema);
        }

        public async Task<IEnumerable<ProcedureDto>> GetProcedures(string type)
        {
            var query =
                 "SELECT routine_schema As DatabaseSchema, routine_name As Name, routine_type AS ProcedureType " +
                 "FROM information_schema.routines " +
                 "WHERE routine_schema NOT IN ('pg_catalog', 'information_schema') AND routine_type = @Type " +
                 "ORDER BY routine_schema";

            var result = await _connection.QueryAsync<ProcedureRaw>(query, new { Type  = type });

            return result.Select(p =>
            {
                return new ProcedureDto()
                {
                    DatabaseSchema = p.DatabaseSchema,
                    Name = p.Name,
                    ProcedureType = p.ProcedureType switch
                    {
                        "FUNCTION" => ProcedureType.Function,
                        "PROCEDURE" => ProcedureType.Procedure,
                        _ => ProcedureType.Unknown
                    }
                };
            });
        }

        public async Task<string> GetProcedureDefinition(string schema, string name)
        {
            var query = "SELECT pg_get_functiondef((" +
                        "SELECT pg_proc.oid FROM pg_proc " +
                        "JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid " +
                        "WHERE proname = @Name AND nspname = @Schema" +
                        "));";

            return await _connection.QueryFirstAsync<string>(query, new
            {
                Name = name,
                Schema = schema
            });
        }

        public string GetDropProcedureScript(string schema, string name)
        {
            schema = EnsureValidIdentifier(schema, nameof(schema));
            name = EnsureValidIdentifier(name, nameof(name));
            return $"DROP PROCEDURE {schema}.{name};";
        }

        public async Task<IEnumerable<ViewDto>> GetViews()
        {
            var query =
                "SELECT table_schema AS DatabaseSchema, table_name AS Name " +
                "FROM information_schema.tables " +
                "WHERE table_schema NOT IN ('pg_catalog', 'information_schema') " +
                "AND table_type = 'VIEW' " +
                "ORDER BY table_schema";
            return await _connection.QueryAsync<ViewDto>(query);
        }

        public async Task<string> GetViewDefinition(string schema, string name)
        {
            var query = "SELECT 'CREATE OR REPLACE VIEW ' || table_name || ' AS ' || view_definition " +
                "FROM information_schema.views " +
                "WHERE table_name = @ViewName AND table_schema = @Schema;";

            return await _connection.QueryFirstAsync<string>(query, new
                {
                    Schema = schema,
                    ViewName  = name
                });
        }

        public string GetCreateViewScript(string schema)
        {
            var result =
@"CREATE OR REPLACE VIEW {0}.MyView AS
SELECT
    -- columns
FROM
    -- tables
WHERE
    -- conditions";

            return string.Format(result, schema);
        }

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

            if (recordsNumber.HasValue && recordsNumber.Value > -1)
            {
                sql += " LIMIT @Limit";
                return await ExecuteSingleQuery(sql, new { Limit = recordsNumber.Value });
            }

            return await ExecuteSingleQuery(sql);
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

            return
                $"CREATE TABLE {schema}.\"MyTable\"" +
                "\r\n(" +
                "\r\n    \"Id\" integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 )," +
                "\r\n    CONSTRAINT \"PK_[MyTable]_Id\" PRIMARY KEY (\"Id\")" +
                "\r\n);";
        }

        public async Task<string> GetCreateTableScript(string schema, string table)
        {
            schema = EnsureValidIdentifier(schema, nameof(schema));
            table = EnsureValidIdentifier(table, nameof(table));

            var sql = string.Format(
                @"SELECT 
                    'CREATE TABLE ' || regclass(c.oid) || ' (' || E'\n' ||
                    (SELECT string_agg('    ' || quote_ident(a.attname) || ' ' || format_type(a.atttypid, a.atttypmod) || 
                        CASE WHEN a.attnotnull THEN ' NOT NULL' ELSE '' END, E',\n')
                     FROM pg_attribute a 
                     WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped) || E'\n' ||
                    ');' || E'\n\n' ||
    
                    -- Indexes
                    COALESCE((SELECT string_agg(pg_get_indexdef(i.indexrelid) || ';', E'\n')
                     FROM pg_index i WHERE i.indrelid = c.oid), '') || E'\n\n' ||
                    -- Foreign Keys and other constraints
                    COALESCE((SELECT string_agg('ALTER TABLE ' || quote_ident(c.relname) || ' ADD ' || pg_get_constraintdef(con.oid) || ';', E'\n')
                     FROM pg_constraint con WHERE con.conrelid = c.oid), '') AS full_ddl
                FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE c.relname = '{0}'
                  AND n.nspname = '{1}';", table, schema);

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

            var sql = string.Format(
                @"SELECT 
'INSERT INTO ' || regclass(c.oid) || ' (' ||
(SELECT string_agg(quote_ident(a.attname), ', ')
 FROM pg_attribute a 
 WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped) || ')
VALUES (' ||
(SELECT string_agg('DEFAULT', ', ')
 FROM pg_attribute a 
 WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped) || ');' AS insert_ddl
                FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE c.relname = '{0}'
                  AND n.nspname = '{1}';", table, schema);

            return await GetTableScript(sql);
        }

        private async Task<string> GetTableScript(string sqlScript)
        {
            var rawResult = await ExecuteSingleQuery(sqlScript);

            if (rawResult.Result.Rows.Count > 0 && rawResult.Result.Columns.Count > 0)
            {
                var script = rawResult.Result.Rows[0][0].ToString();
                return script!;
            }

            return string.Empty;
        }

        public async Task<DatabaseSingleCommandResultRaw> ExecuteSingleQuery(string cmdQuery, object? parameters = null)
        {
            using var reader = await _connection.ExecuteReaderAsync(cmdQuery, parameters);
            DataTable dt = new DataTable();

            if (reader.HasRows)
            {
                dt.Load(reader);
            }

            return new DatabaseSingleCommandResultRaw()
            {
                RecordsAffected = reader.RecordsAffected,
                Result = dt
            };
        }

        public async Task<DatabaseCommandResultRaw> ExecuteQuery(string cmdQuery, object? parameters = null)
        {
            await using var command = new NpgsqlCommand(cmdQuery, _connection);
            if (parameters != null)
            {
                var props = parameters.GetType().GetProperties();
                foreach (var prop in props)
                {
                    var value = prop.GetValue(parameters) ?? DBNull.Value;
                    command.Parameters.AddWithValue(prop.Name, value);
                }
            }

            await using var reader = await command.ExecuteReaderAsync();
            var results = new List<DataTable>();

            while (!reader.IsClosed && reader.HasRows)
            {
                var table = new DataTable();

                table.BeginLoadData();
                table.Load(reader);
                table.EndLoadData();

                if (table.Columns.Count > 0)
                {
                    results.Add(table);
                }
            }

            return new DatabaseCommandResultRaw
            {
                RecordsAffected = results.Sum(t => t.Rows.Count),
                Results = results
            };
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
