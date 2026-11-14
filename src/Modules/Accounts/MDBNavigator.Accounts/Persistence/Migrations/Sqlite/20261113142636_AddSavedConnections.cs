using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MDBNavigator.Accounts.Persistence.Migrations.Sqlite
{
    /// <inheritdoc />
    public partial class AddSavedConnections : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "saved_connections",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    owner_id = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    normalized_name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    server_type = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    server_name = table.Column<string>(type: "TEXT", maxLength: 253, nullable: false),
                    port = table.Column<int>(type: "INTEGER", nullable: false),
                    database_name = table.Column<string>(type: "TEXT", maxLength: 128, nullable: true),
                    user_name = table.Column<string>(type: "TEXT", maxLength: 128, nullable: false),
                    color = table.Column<string>(type: "TEXT", maxLength: 7, nullable: true),
                    created_at_utc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    updated_at_utc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_saved_connections", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_saved_connections_owner_id_normalized_name",
                table: "saved_connections",
                columns: new[] { "owner_id", "normalized_name" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "saved_connections");
        }
    }
}
