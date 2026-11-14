using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MDBNavigator.Accounts.Persistence.Migrations.Sqlite
{
    /// <inheritdoc />
    public partial class AddSavedConnectionPassword : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte[]>(
                name: "protected_password",
                table: "saved_connections",
                type: "BLOB",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "protected_password",
                table: "saved_connections");
        }
    }
}
