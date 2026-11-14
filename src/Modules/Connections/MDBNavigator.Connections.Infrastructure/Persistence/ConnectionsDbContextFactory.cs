using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace MDBNavigator.Connections.Infrastructure.Persistence
{
    // Used only by the EF Core tools (dotnet ef migrations add), so they don't depend on how the API is configured.
    public class ConnectionsDbContextFactory : IDesignTimeDbContextFactory<ConnectionsDbContext>
    {
        public ConnectionsDbContext CreateDbContext(string[] args)
        {
            var options = new DbContextOptionsBuilder<ConnectionsDbContext>();
            ConnectionsDbContext.Configure(options, "Data Source=design-time.db");
            return new ConnectionsDbContext(options.Options);
        }
    }
}
