using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace MDBNavigator.Infrastructure.Accounts.Persistence
{
    // Used only by the EF Core tools (dotnet ef migrations add), so they don't depend on how the API is configured.
    public class AccountsDbContextFactory : IDesignTimeDbContextFactory<AccountsDbContext>
    {
        public AccountsDbContext CreateDbContext(string[] args)
        {
            var options = new DbContextOptionsBuilder<AccountsDbContext>();
            AccountsDbContext.Configure(options, "Data Source=design-time.db");
            return new AccountsDbContext(options.Options);
        }
    }
}
