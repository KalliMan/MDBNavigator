using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MDBNavigator.Accounts.Persistence.Migrations.Sqlite
{
    /// <inheritdoc />
    public partial class AddDemoInviteNames : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "invite_name",
                table: "demo_visitors",
                type: "TEXT",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "invite_name",
                table: "demo_sign_in_links",
                type: "TEXT",
                maxLength: 30,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "invite_name",
                table: "demo_visitors");

            migrationBuilder.DropColumn(
                name: "invite_name",
                table: "demo_sign_in_links");
        }
    }
}
