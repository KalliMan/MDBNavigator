using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MDBNavigator.Connections.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AdoptSavedConnections : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // The table already exists: the accounts context's migrations AddSavedConnections and AddSavedConnectionPassword
            // created it, before saved connections had a context of their own, and they still run first on a new database.
            // This migration only records the model, so later changes to the table start from it.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Nothing to undo: see Up.
        }
    }
}
