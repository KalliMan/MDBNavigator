using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MDBNavigator.Accounts.Persistence.Migrations.Sqlite
{
    /// <inheritdoc />
    public partial class AddDemoGuests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "demo_sign_in_links",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    token_hash = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    email = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    normalized_email = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    terms_version = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    created_at_utc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    expires_at_utc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    used_at_utc = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_demo_sign_in_links", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "demo_visitors",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    email = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    normalized_email = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    terms_version = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    terms_accepted_at_utc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    created_at_utc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    last_visit_at_utc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    visit_count = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_demo_visitors", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "demo_guest_sessions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    visitor_id = table.Column<Guid>(type: "TEXT", nullable: false),
                    user_id = table.Column<Guid>(type: "TEXT", nullable: false),
                    started_at_utc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ends_at_utc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_demo_guest_sessions", x => x.id);
                    table.ForeignKey(
                        name: "fk_demo_guest_sessions_demo_visitors_visitor_id",
                        column: x => x.visitor_id,
                        principalTable: "demo_visitors",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_demo_guest_sessions_ends_at_utc",
                table: "demo_guest_sessions",
                column: "ends_at_utc");

            migrationBuilder.CreateIndex(
                name: "ix_demo_guest_sessions_user_id",
                table: "demo_guest_sessions",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_demo_guest_sessions_visitor_id_started_at_utc",
                table: "demo_guest_sessions",
                columns: new[] { "visitor_id", "started_at_utc" });

            migrationBuilder.CreateIndex(
                name: "ix_demo_sign_in_links_created_at_utc",
                table: "demo_sign_in_links",
                column: "created_at_utc");

            migrationBuilder.CreateIndex(
                name: "ix_demo_sign_in_links_normalized_email_created_at_utc",
                table: "demo_sign_in_links",
                columns: new[] { "normalized_email", "created_at_utc" });

            migrationBuilder.CreateIndex(
                name: "ix_demo_sign_in_links_token_hash",
                table: "demo_sign_in_links",
                column: "token_hash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_demo_visitors_last_visit_at_utc",
                table: "demo_visitors",
                column: "last_visit_at_utc");

            migrationBuilder.CreateIndex(
                name: "ix_demo_visitors_normalized_email",
                table: "demo_visitors",
                column: "normalized_email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "demo_guest_sessions");

            migrationBuilder.DropTable(
                name: "demo_sign_in_links");

            migrationBuilder.DropTable(
                name: "demo_visitors");
        }
    }
}
