using Microsoft.Data.Sqlite;

namespace MDBNavigator.API
{
    // The app's own SQLite file. The accounts and the connections module both keep their tables in it, so the API
    // resolves its location once and hands it to both.
    public static class AppDb
    {
        public const string ConnectionStringName = "AppDb";
        public const string DefaultConnectionString = "Data Source=data/mdbnavigator.db";

        // A relative file path is taken from the app's folder, not the current directory, so the database is in the
        // same place however the app is started (Visual Studio, dotnet run, a container).
        public static string ResolveConnectionString(IConfiguration configuration, IHostEnvironment environment)
        {
            var builder = new SqliteConnectionStringBuilder(
                configuration.GetConnectionString(ConnectionStringName) ?? DefaultConnectionString);
            if (builder.DataSource != ":memory:" && !Path.IsPathRooted(builder.DataSource))
            {
                builder.DataSource = Path.GetFullPath(Path.Combine(environment.ContentRootPath, builder.DataSource));
            }
            return builder.ToString();
        }
    }
}
