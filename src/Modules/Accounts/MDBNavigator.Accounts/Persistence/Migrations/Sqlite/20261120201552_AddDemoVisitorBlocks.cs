using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MDBNavigator.Accounts.Persistence.Migrations.Sqlite
{
    /// <inheritdoc />
    public partial class AddDemoVisitorBlocks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "blocked_until_utc",
                table: "demo_visitors",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "blocked_until_utc",
                table: "demo_visitors");
        }
    }
}
