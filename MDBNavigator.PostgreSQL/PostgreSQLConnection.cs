using Dapper;
using MDBNavigator.DAL.Interfaces;
using Models;
using Npgsql;

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
                throw new Exception("Unable to connect to server. The error is: " + ex.Message);
            }
        }

        public async Task Disconnect()
        {
            await _connection.DisposeAsync();
            _connection = null!;
        }

//        public string GetDataSource

        //public DatabaseConnectionInfoDto GetDetails()
        //{
        //    return new DatabaseConnectionInfoDto
        //    {
        //        ServerType = "PostgreSQL",
        //        DataSource = _connection.DataSource,
        //        ServerVersion = _connection.ServerVersion,
        //        UserName = _connection.UserName
        //    };
        //}


        public async Task<IEnumerable<DatabaseDto>> GetDatabases()
            => await _connection.QueryAsync<DatabaseDto>("SELECT oid AS InternalId, datname AS Name FROM pg_database;");
/*
        public async Task<IEnumerable<DatabaseSchemaDto>> GetDatabaseSchemas()
            => await _connection.QueryAsync<DatabaseSchemaDto>("SELECT schema_name AS Name, schema_owner AS Owner FROM information_schema.schemata;");
*/
        public async Task<IEnumerable<TableDto>> GetTables(string databaseName)
        {
            var query = $"SELECT table_schema AS DatabaseSchema, table_name AS Name " +
                "FROM information_schema.tables  WHERE " +
                "table_schema NOT IN ('pg_catalog', 'information_schema')" +
                $"AND table_type='BASE TABLE' AND table_catalog='{databaseName}'";

            var result = await _connection.QueryAsync<TableDto>(query);
            return result;
        }

/*        public  async Task<DatabaseCommandResultRaw> ExecuteQuery(string script)
        {
            using var reader = await _connection.ExecuteReaderAsync(script);            
            DataTable dt = new DataTable();

            if (reader.HasRows)
            {
                dt.Load(reader);
            }

            return new DatabaseCommandResultRaw()
            {                
                Result = dt
            };
        }
        */
    }
}

/*
   public  async Task<DatabaseCommantResultRaw> ExecuteQuery(string script)
        {
            using var reader = await _connection.ExecuteReaderAsync(script);

            //var fields = Enumerable.Range(0, reader.FieldCount).Select(index => new DatabaseCommantResultField()
            //{
            //    Index = index,
            //    FieldName = reader.GetName(index),
            //    FieldType = reader.GetFieldType(index).ToString(),
            //    FieldDataTypeName = reader.GetDataTypeName(index).ToString(),
            //}).ToList();
            DataTable dt = new DataTable();
            dt.Load(reader);
            return new DatabaseCommantResultRaw()
            {
                Result = dt
            };

            //do
            //{
            //    DataTable dt = new DataTable();
            //    dt.Load(reader);

            //    result.ResultSet.Add(dt);
            //} while (!reader.IsClosed && await reader.NextResultAsync());
            //return result;
        }
 * 

/*
await using var command = _connection.CreateCommand();
command.CommandText = query;
await using var reader = await command.ExecuteReaderAsync();

while (await reader.ReadAsync())
{
    var res = reader.GetString(0);
}
*/
