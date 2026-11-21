using MDBNavigator.API.Tests.Infrastructure;
using System.Net;
using System.Text.Json;

namespace MDBNavigator.API.Tests
{
    // Scripts for objects whose names need quoting (SampleSchema: schema Smoke "Quoted", table Mixed Case), and for
    // functions with overloads. The expected text is what PostgreSQL's quote_ident and the provider's C# code produce.
    [Collection(ApiCollection.Name)]
    public class ScriptQuotingTests
    {
        private const string QuotedTable = "\"Smoke \"\"Quoted\"\"\".\"Mixed Case\"";
        private const string QuotedTableQuery = "schema=" + "Smoke%20%22Quoted%22" + "&table=Mixed%20Case";

        private readonly AppFixture _fixture;

        public ScriptQuotingTests(AppFixture fixture) => _fixture = fixture;

        // The script endpoints answer with the script as the body. A string result may come as text/plain or as a JSON string.
        private async Task<string> ScriptAsync(ApiSession session, string connectionId, string route, string query, HttpStatusCode expected = HttpStatusCode.OK)
        {
            var response = await session.Client.GetAsync($"/api/databaseCommand/{route}/{connectionId}?database=postgres&{query}")
                .ShouldBeAsync(expected);

            var body = await response.Content.ReadAsStringAsync();
            // An error answer is a JSON object (not a string), so only a success is unwrapped.
            if (response.IsSuccessStatusCode && response.Content.Headers.ContentType?.MediaType == "application/json")
            {
                body = JsonSerializer.Deserialize<string>(body)!;
            }

            return body.Replace("\r\n", "\n");
        }

        private static string Escape(string value) => Uri.EscapeDataString(value);

        // A signed-in user with a connection to the test container.
        private async Task<(ApiSession Session, string ConnectionId)> ConnectedAsync()
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            return (session, await session.ConnectAsync());
        }

        [Fact]
        public async Task Drop_table_quotes_schema_and_table()
        {
            var (session, connectionId) = await ConnectedAsync();
            using var signedIn = session;

            var script = await ScriptAsync(session, connectionId, "dropTableScript", QuotedTableQuery);

            Assert.Equal($"DROP TABLE {QuotedTable};", script);
        }

        [Fact]
        public async Task Create_table_script_quotes_every_name()
        {
            var (session, connectionId) = await ConnectedAsync();
            using var signedIn = session;

            var script = await ScriptAsync(session, connectionId, "createTableScript", QuotedTableQuery);

            Assert.StartsWith($"CREATE TABLE {QuotedTable} (", script);
            Assert.Contains("\"Order Id\" integer NOT NULL", script);
            Assert.Contains("\"Note\" text", script);
            Assert.Contains($"ALTER TABLE {QuotedTable} ADD PRIMARY KEY (\"Order Id\");", script);
        }

        [Fact]
        public async Task Insert_table_script_quotes_every_name()
        {
            var (session, connectionId) = await ConnectedAsync();
            using var signedIn = session;

            var script = await ScriptAsync(session, connectionId, "insertTableScript", QuotedTableQuery);

            Assert.Equal($"INSERT INTO {QuotedTable} (\"Order Id\", \"Note\")\nVALUES (DEFAULT, DEFAULT);", script);
        }

        [Fact]
        public async Task Table_records_script_quotes_schema_and_table()
        {
            var (session, connectionId) = await ConnectedAsync();
            using var signedIn = session;

            var script = await ScriptAsync(session, connectionId, "tableRecordsScript", $"{QuotedTableQuery}&recordsNumber=5");

            Assert.Equal($"SELECT * FROM {QuotedTable} LIMIT 5", script);
        }

        [Fact]
        public async Task Drop_routine_script_has_one_line_per_overload()
        {
            var (session, connectionId) = await ConnectedAsync();
            using var signedIn = session;

            var script = await ScriptAsync(session, connectionId, "dropProcedureScript", "schema=public&name=smoke_add");

            // Ordered by oid: the int overload was created first.
            Assert.Equal(
                "DROP FUNCTION \"public\".\"smoke_add\"(a integer, b integer);\n" +
                "DROP FUNCTION \"public\".\"smoke_add\"(a text, b text);",
                script);
        }

        [Fact]
        public async Task Drop_routine_script_uses_the_procedure_keyword_for_a_procedure()
        {
            var (session, connectionId) = await ConnectedAsync();
            using var signedIn = session;

            var script = await ScriptAsync(session, connectionId, "dropProcedureScript", "schema=public&name=smoke_noop");

            Assert.Equal("DROP PROCEDURE \"public\".\"smoke_noop\"();", script);
        }

        [Fact]
        public async Task Routine_definition_has_every_overload()
        {
            var (session, connectionId) = await ConnectedAsync();
            using var signedIn = session;

            var script = await ScriptAsync(session, connectionId, "procedureDefinition", "schema=public&name=smoke_add");

            // pg_get_functiondef writes public without quotes.
            Assert.Contains("CREATE OR REPLACE FUNCTION public.smoke_add(a integer, b integer)", script);
            Assert.Contains("CREATE OR REPLACE FUNCTION public.smoke_add(a text, b text)", script);
        }

        [Theory]
        [InlineData("createTableScript", "schema=public&table=no_such_table")]
        [InlineData("insertTableScript", "schema=public&table=no_such_table")]
        [InlineData("procedureDefinition", "schema=public&name=no_such_routine")]
        [InlineData("dropProcedureScript", "schema=public&name=no_such_routine")]
        [InlineData("viewDefinition", "schema=public&name=no_such_view")]
        public async Task An_object_that_does_not_exist_answers_404(string route, string query)
        {
            var (session, connectionId) = await ConnectedAsync();
            using var signedIn = session;

            await ScriptAsync(session, connectionId, route, query, HttpStatusCode.NotFound);
        }

        [Fact]
        public async Task An_invalid_identifier_answers_400()
        {
            var (session, connectionId) = await ConnectedAsync();
            using var signedIn = session;

            await ScriptAsync(session, connectionId, "dropTableScript", $"schema={Escape(" ")}&table=t", HttpStatusCode.BadRequest);
        }
    }
}
