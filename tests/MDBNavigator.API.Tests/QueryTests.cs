using MDBNavigator.API.Tests.Infrastructure;
using System.Net;
using System.Text.Json;

namespace MDBNavigator.API.Tests
{
    // Each fact signs in a fresh user, connects, and listens on the hub before it starts a query, so no message is missed.
    [Collection(ApiCollection.Name)]
    public class QueryTests
    {
        private static readonly TimeSpan Timeout = TimeSpan.FromSeconds(30);
        private static readonly TimeSpan CancelTimeout = TimeSpan.FromSeconds(15);

        private readonly AppFixture _fixture;

        public QueryTests(AppFixture fixture) => _fixture = fixture;

        private static int ErrorOffset(QueryRun run) => run.Finished.GetProperty("errorOffset").GetInt32();

        [Fact]
        public async Task A_select_streams_its_rows_and_finishes()
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            using var signedIn = session;
            var connectionId = await session.ConnectAsync();
            await using var hub = await session.ListenAsync();

            var run = await session.RunAsync(connectionId, "select id, name from smoke_items order by id", hub);

            Assert.Equal("Completed", run.Finished.GetProperty("status").GetString());
            Assert.Equal(2, run.Finished.GetProperty("rowCount").GetInt32());
            Assert.Equal(JsonValueKind.Null, run.Finished.GetProperty("error").ValueKind);
            Assert.Equal(JsonValueKind.Null, run.Finished.GetProperty("errorOffset").ValueKind);

            var fields =run.Batches[0].GetProperty("fields").EnumerateArray().ToArray();
            Assert.Equal(["id", "name"], fields.Select(field => field.GetProperty("fieldName").GetString()));
            Assert.Equal(["Number", "Text"], fields.Select(field => field.GetProperty("category").GetString()));

            var rows = run.Batches.SelectMany(batch => batch.GetProperty("rows").EnumerateArray()).Select(row => row.GetRawText());
            Assert.Equal(["[1,\"one\"]", "[2,\"two\"]"], rows);
        }

        [Fact]
        public async Task A_script_runs_statement_by_statement()
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            using var signedIn = session;
            var connectionId = await session.ConnectAsync();
            await using var hub = await session.ListenAsync();

            var run = await session.RunAsync(connectionId, "select 1; select 2;", hub);

            Assert.Equal(2, run.Statements.Count);
            Assert.All(run.Statements, statement => Assert.Equal(2, statement.GetProperty("statementCount").GetInt32()));
            Assert.Equal(2, run.Batches.Select(batch => batch.GetProperty("resultSetIndex").GetInt32()).Distinct().Count());
            Assert.Equal("Completed", run.Finished.GetProperty("status").GetString());
            Assert.Equal(2, run.Finished.GetProperty("rowCount").GetInt32());
        }

        [Fact]
        public async Task A_failing_statement_reports_its_error()
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            using var signedIn = session;
            var connectionId = await session.ConnectAsync();
            await using var hub = await session.ListenAsync();

            var run = await session.RunAsync(connectionId, "select * from no_such_table", hub);

            Assert.Equal("Failed", run.Finished.GetProperty("status").GetString());
            Assert.Contains("no_such_table", run.Finished.GetProperty("error").GetString());
        }

        [Fact]
        public async Task A_failing_statement_in_a_script_is_named()
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            using var signedIn = session;
            var connectionId = await session.ConnectAsync();
            await using var hub = await session.ListenAsync();

            var run = await session.RunAsync(connectionId, "select 1; select * from no_such_table;", hub);

            Assert.Equal("Failed", run.Finished.GetProperty("status").GetString());
            Assert.StartsWith("Statement 2 of 2", run.Finished.GetProperty("error").GetString());
        }

        [Fact]
        public async Task An_error_says_where_it_is()
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            using var signedIn = session;
            var connectionId = await session.ConnectAsync();
            await using var hub = await session.ListenAsync();
            var sql = "select * from no_such_table";

            var run = await session.RunAsync(connectionId, sql, hub);

            Assert.Equal("Failed", run.Finished.GetProperty("status").GetString());
            Assert.Equal(sql.IndexOf("no_such_table", StringComparison.Ordinal), ErrorOffset(run));
        }

        [Fact]
        public async Task The_place_counts_from_the_start_of_the_script()
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            using var signedIn = session;
            var connectionId = await session.ConnectAsync();
            await using var hub = await session.ListenAsync();
            var sql = "select 1;\n-- second\nselect * from no_such_table;";

            var run = await session.RunAsync(connectionId, sql, hub);

            Assert.Equal("Failed", run.Finished.GetProperty("status").GetString());
            Assert.StartsWith("Statement 2 of 2 (line 3)", run.Finished.GetProperty("error").GetString());
            Assert.Equal(sql.IndexOf("no_such_table", StringComparison.Ordinal), ErrorOffset(run));
        }

        [Fact]
        public async Task The_place_is_right_after_characters_a_string_counts_twice()
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            using var signedIn = session;
            var connectionId = await session.ConnectAsync();
            await using var hub = await session.ListenAsync();
            // PostgreSQL counts the emoji as one character, a .NET string as two.
            var sql = "select '😀', 'жълт' from no_such_table";

            var run = await session.RunAsync(connectionId, sql, hub);

            Assert.Equal("Failed", run.Finished.GetProperty("status").GetString());
            Assert.Equal(sql.IndexOf("no_such_table", StringComparison.Ordinal), ErrorOffset(run));
        }

        [Fact]
        public async Task An_error_without_a_place_has_no_offset()
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            using var signedIn = session;
            var connectionId = await session.ConnectAsync();
            await using var hub = await session.ListenAsync();

            var run = await session.RunAsync(connectionId, "select 1/0", hub);

            Assert.Equal("Failed", run.Finished.GetProperty("status").GetString());
            Assert.Equal(JsonValueKind.Null, run.Finished.GetProperty("errorOffset").ValueKind);
        }

        [Fact]
        public async Task An_error_inside_a_function_shows_its_query_and_context()
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            using var signedIn = session;
            var connectionId = await session.ConnectAsync();
            await using var hub = await session.ListenAsync();

            var run = await session.RunAsync(connectionId, "do $$ begin perform * from no_such_table; end $$", hub);

            Assert.Equal("Failed", run.Finished.GetProperty("status").GetString());
            var error = run.Finished.GetProperty("error").GetString();
            Assert.Contains("\nQUERY: ", error);
            Assert.Contains("\nCONTEXT: PL/pgSQL function inline_code_block line 1 at PERFORM", error);
            // The place is in the function's own query, not in the user's text.
            Assert.Equal(JsonValueKind.Null, run.Finished.GetProperty("errorOffset").ValueKind);
        }

        [Fact]
        public async Task A_running_query_can_be_cancelled()
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            using var signedIn = session;
            var connectionId = await session.ConnectAsync();
            await using var hub = await session.ListenAsync();
            var executionId = Guid.NewGuid().ToString();
            await session.PostExecuteAsync(connectionId, "select pg_sleep(30)", executionId).ShouldBeAsync(HttpStatusCode.Accepted);
            await hub.WaitForStatementStartedAsync(executionId, Timeout);

            await session.Client.PostAsync($"/api/databaseCommand/cancel/{executionId}", content: null).ShouldBeAsync(HttpStatusCode.NoContent);

            var finished = await hub.WaitForFinishedAsync(executionId, CancelTimeout);
            Assert.Equal("Cancelled", finished.GetProperty("status").GetString());
        }

        [Fact]
        public async Task A_query_on_an_unknown_connection_fails()
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            using var signedIn = session;
            await using var hub = await session.ListenAsync();

            // The API accepts the execution first; the failure arrives as the outcome.
            var run = await session.RunAsync(Guid.NewGuid().ToString(), "select 1", hub);

            Assert.Equal("Failed", run.Finished.GetProperty("status").GetString());
            Assert.Contains("Not Connected", run.Finished.GetProperty("error").GetString());
        }

        [Fact]
        public async Task Statements_that_change_data_are_applied()
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            using var signedIn = session;
            var connectionId = await session.ConnectAsync();
            await using var hub = await session.ListenAsync();
            var table = $"smoke_tmp_{Guid.NewGuid():N}";

            var create = await session.RunAsync(connectionId, $"create table {table} (id int); insert into {table} values (1), (2), (3);", hub);
            var count = await session.RunAsync(connectionId, $"select count(*) from {table}", hub);
            var drop = await session.RunAsync(connectionId, $"drop table {table}", hub);

            Assert.Equal("Completed", create.Finished.GetProperty("status").GetString());
            Assert.Equal("Completed", count.Finished.GetProperty("status").GetString());
            Assert.Equal("Completed", drop.Finished.GetProperty("status").GetString());
            var rows = count.Batches.SelectMany(batch => batch.GetProperty("rows").EnumerateArray()).Select(row => row.GetRawText());
            // count(*) is a bigint, and 64-bit integers go out as strings so the browser cannot round them (JsonCellValue).
            Assert.Equal(["[\"3\"]"], rows);
        }

        [Fact]
        public async Task A_user_cannot_run_more_than_three_queries_at_once()
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            using var signedIn = session;
            var connectionId = await session.ConnectAsync();
            await using var hub = await session.ListenAsync();
            var running = new List<string>();

            try
            {
                for (var i = 0; i < 3; i++)
                {
                    var executionId = Guid.NewGuid().ToString();
                    await session.PostExecuteAsync(connectionId, "select pg_sleep(30)", executionId).ShouldBeAsync(HttpStatusCode.Accepted);
                    running.Add(executionId);
                    await hub.WaitForStatementStartedAsync(executionId, Timeout);
                }

                await session.PostExecuteAsync(connectionId, "select 1", Guid.NewGuid().ToString())
                    .ShouldBeAsync(HttpStatusCode.TooManyRequests);
            }
            finally
            {
                // The sleeps would otherwise hold their database connections for 30 seconds.
                foreach (var executionId in running)
                {
                    await session.Client.PostAsync($"/api/databaseCommand/cancel/{executionId}", content: null);
                }
            }

            foreach (var executionId in running)
            {
                var finished = await hub.WaitForFinishedAsync(executionId, CancelTimeout);
                Assert.Equal("Cancelled", finished.GetProperty("status").GetString());
            }
        }
    }
}
