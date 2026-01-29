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
            var tablesQuery = $"SELECT table_schema AS DatabaseSchema, table_name AS Name " +
                "FROM information_schema.tables  WHERE " +
                "table_schema NOT IN ('pg_catalog', 'information_schema')" +
                "AND table_type='BASE TABLE' " +
                "ORDER BY table_schema";

            return await _connection.QueryAsync<Table>(tablesQuery);
        }

        public async Task<TableDefinition> GetTableDefinition(string schema, string table)
        {
            var query =
                "SELECT column_name AS ColumnName, data_type AS DataType, " +
                "CASE WHEN is_nullable = 'YES' THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END AS IsNullable," +
                "character_maximum_length AS MaxLength " +
                "FROM information_schema.columns " +
                "WHERE table_schema = @Schema AND table_name = @Table " +
                "ORDER BY ordinal_position";
            var columns = await _connection.QueryAsync<TableColumn>(query, new
            {
                Schema = schema,
                Table = table
            });

            return new()
            {
                Columns = columns
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
