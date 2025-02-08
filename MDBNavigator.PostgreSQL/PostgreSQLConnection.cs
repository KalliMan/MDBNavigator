using Dapper;
using MDBNavigator.DAL.Interfaces;
using Models.Command;
using Models.Connect;
using Models.Schema;
using Npgsql;
using System.Data;
using static Dapper.SqlMapper;

namespace MDBNavigator.PostgreSQL
{
    public class PostgreSQL : IDBServerBase
    {
        NpgsqlConnection _connection = null!;

        public string DataSource
        {
            get => _connection.DataSource;
        }

        public async Task Connect(ConnectionSettings settings)
        {
            try
            {
                var cnnString = $"Server={settings.ServerName};User Id={settings.UserName};Password={settings.Password};";
                if (!string.IsNullOrEmpty(settings.DatabaseName))
                {
                    cnnString += $"Database={settings.DatabaseName}";
                }
                _connection = new NpgsqlConnection(cnnString);
                await _connection.OpenAsync();
            }
            catch (Exception ex)
            {
                throw new Exception($"{ex.Message} {ex.InnerException?.Message}");
            }
        }

        public async Task Disconnect()
        {
            await _connection.DisposeAsync();
            _connection = null!;
        }

        public async Task<IEnumerable<DatabaseDto>> GetDatabases()
            => await _connection.QueryAsync<DatabaseDto>("SELECT oid AS InternalId, datname AS Name FROM pg_database WHERE datistemplate = false ORDER BY oid DESC;");

        public async Task<IEnumerable<TableDto>> GetTables()
        {
            var query = $"SELECT table_schema AS DatabaseSchema, table_name AS Name " +
                "FROM information_schema.tables  WHERE " +
                "table_schema NOT IN ('pg_catalog', 'information_schema')" +
                $"AND table_type='BASE TABLE'";

            var result = await _connection.QueryAsync<TableDto>(query);
            return result;
        }

        public async Task<IEnumerable<ProcedureDto>> GetStoredProcedures()
            => await GetProcedures("PROCEDURE");

        public async Task<IEnumerable<ProcedureDto>> GetFunctions()
            => await GetProcedures("FUNCTION");

        public async Task<IEnumerable<ProcedureDto>> GetProcedures(string type)
        {
            var query = $"SELECT routine_schema As DatabaseSchema, routine_name As Name, routine_type AS ProcedureType FROM information_schema.routines WHERE routine_schema NOT IN ('pg_catalog', 'information_schema') AND routine_type = '{type}'";

            var result = await _connection.QueryAsync<ProcedureRaw>(query);

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
            var query = $"SELECT pg_get_functiondef((SELECT pg_proc.oid FROM pg_proc JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid WHERE proname = '{name}' AND nspname = '{schema}'));";
            return await _connection.QueryFirstAsync<string>(query);
        }

        public async Task<DatabaseCommandResultRaw> GetTopNTableRecords(string schema, string table, int? recordsNumber)
        {
            var cmdQuery = GetTopNTableRecordsScript(schema, table, recordsNumber);
            return await ExecuteQuery(cmdQuery);
        }

        public string GetTopNTableRecordsScript(string schema, string table, int? recordsNumber)
        {
            var script = $"SELECT * FROM {schema}.\"{table}\" ";
            if (recordsNumber.HasValue && recordsNumber.Value > -1)
            {
                script += $"LIMIT {recordsNumber}";
            }
            return script;
        }

        public string GetCreateTableScript(string schema)
            => $"CREATE TABLE {schema}.\"[MyTable]\"\r\n(\r\n    \"Id\" integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 ),\r\n    CONSTRAINT \"PK_[MyTable]_Id\" PRIMARY KEY (\"Id\")\r\n);";

        public string GetDropTableScript(string schema, string table)
            => $"DROP TABLE {schema}.\"{table}\"";

        public async Task<DatabaseCommandResultRaw> ExecuteQuery(string cmdQuery)
        {
            using var reader = await _connection.ExecuteReaderAsync(cmdQuery);
            DataTable dt = new DataTable();

            if (reader.HasRows)
            {
                dt.Load(reader);
            }

            return new DatabaseCommandResultRaw()
            {
                RecordsAffected = reader.RecordsAffected,
                Result = dt
            };
        }

    }
}
