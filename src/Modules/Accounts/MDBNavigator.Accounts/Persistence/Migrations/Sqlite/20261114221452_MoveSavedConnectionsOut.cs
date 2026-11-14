using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MDBNavigator.Accounts.Persistence.Migrations.Sqlite
{
    /// <inheritdoc />
    public partial class MoveSavedConnectionsOut : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // The saved_connections table stays where it is. From here on it belongs to the connections module's own
            // context (ConnectionsDbContext); this migration only takes it out of this context's model.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Nothing to undo: see Up.
        }
    }
}
