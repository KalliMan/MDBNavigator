using Dapper;
using MDBNavigator.Providers.Abstractions;
using Npgsql;

namespace MDBNavigator.Providers.PostgreSQL
{
    internal sealed class PostgresScriptGenerator : IScriptGenerator
    {
        private readonly NpgsqlConnection _connection;

        // Functions ('f') and procedures ('p'); aggregates/window functions have no editable definition.
        private const string RoutineKinds = "('f', 'p')";

        // Always schema-qualified, unlike regclass output (which drops schemas on the search_path).
        // Expects pg_class c and pg_namespace n in the query.
        private const string QualifiedRelationSql = "quote_ident(n.nspname) || '.' || quote_ident(c.relname)";

        public PostgresScriptGenerator(NpgsqlConnection connection)
        {
            _connection = connection;
        }

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

        public string GetCreateFunctionScript(string schema)
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
            var definitions = (await _connection.QueryAsync<string>(PostgresCommands.Command(
                $@"SELECT pg_get_functiondef(p.oid)
                   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                   WHERE n.nspname = @Schema AND p.proname = @Name AND p.prokind IN {RoutineKinds}
                   ORDER BY p.oid",
                new { Schema = schema, Name = name }, ct))).ToList();

            if (definitions.Count == 0)
            {
                throw new DatabaseObjectNotFoundException($"Routine {schema}.{name} was not found.");
            }

            return string.Join("\n\n", definitions.Select(d => d.TrimEnd() + ";"));
        }

        // One DROP per overload, with the right keyword and the argument types that identify it.
        public async Task<string> GetDropProcedureScript(string schema, string name, CancellationToken ct = default)
        {
            var qualifiedName = QualifiedName(schema, name);
            var routines = (await _connection.QueryAsync<(string Kind, string Arguments)>(PostgresCommands.Command(
                $@"SELECT p.prokind::text AS Kind, pg_get_function_identity_arguments(p.oid) AS Arguments
                   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                   WHERE n.nspname = @Schema AND p.proname = @Name AND p.prokind IN {RoutineKinds}
                   ORDER BY p.oid",
                new { Schema = schema, Name = name }, ct))).ToList();

            if (routines.Count == 0)
            {
                throw new DatabaseObjectNotFoundException($"Routine {schema}.{name} was not found.");
            }

            return string.Join("\n", routines.Select(r =>
                $"DROP {(r.Kind == "p" ? "PROCEDURE" : "FUNCTION")} {qualifiedName}({r.Arguments});"));
        }

        // pg_get_viewdef also works for views the user doesn't own (information_schema.views hides those).
        public async Task<string> GetViewDefinition(string schema, string name, CancellationToken ct = default)
        {
            var definition = await _connection.QueryFirstOrDefaultAsync<string?>(PostgresCommands.Command(
                $@"SELECT 'CREATE OR REPLACE VIEW ' || {QualifiedRelationSql} || ' AS' || E'\n' || pg_get_viewdef(c.oid, true)
                  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                  WHERE c.relkind = 'v' AND n.nspname = @Schema AND c.relname = @Name",
                new { Schema = schema, Name = name }, ct));

            return definition ?? throw new DatabaseObjectNotFoundException($"View {schema}.{name} was not found.");
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

        private async Task<string> GetTableScript(string sql, string schema, string table, CancellationToken ct)
        {
            // The script is the first column of the first row; no row means the table doesn't exist.
            var script = await _connection.ExecuteScalarAsync<string?>(PostgresCommands.Command(sql, new { Schema = schema, Table = table }, ct));
            return script ?? throw new DatabaseObjectNotFoundException($"Table {schema}.{table} was not found.");
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
