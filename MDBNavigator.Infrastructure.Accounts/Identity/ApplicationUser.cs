using Microsoft.AspNetCore.Identity;

namespace MDBNavigator.Infrastructure.Accounts.Identity
{
    public class ApplicationUser : IdentityUser<Guid>
    {
        // Identity creates users with `new TUser()`, so the id and creation time are set here. Version 7 GUIDs are
        // time-ordered, which keeps indexes compact in SQLite and in any database server used later.
        public ApplicationUser()
        {
            Id = Guid.CreateVersion7();
            CreatedAtUtc = DateTime.UtcNow;
        }

        public DateTime CreatedAtUtc { get; set; }
    }
}
