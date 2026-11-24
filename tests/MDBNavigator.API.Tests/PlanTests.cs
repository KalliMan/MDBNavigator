using MDBNavigator.API.Tests.Infrastructure;
using System.Net;
using System.Text.Json;

namespace MDBNavigator.API.Tests
{
    // The plan option of a run: EXPLAIN (Estimate) and EXPLAIN ANALYZE (Analyze, rolled back). Each fact signs in a
    // fresh user, connects, and listens on the hub before it starts a query, so no message is missed.
    [Collection(ApiCollection.Name)]
    public class PlanTests
    {
        private const string Query = "select * from smoke_items where id = 1";

        private readonly AppFixture _fixture;

        public PlanTests(AppFixture fixture) => _fixture = fixture;

        [Fact]
        public async Task Estimate_returns_the_plan_as_one_json_cell()
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            using var signedIn = session;
            var connectionId = await session.ConnectAsync();
            await using var hub = await session.ListenAsync();

            var run = await session.RunAsync(connectionId, Query, hub, plan: "Estimate");

            Assert.Equal("Completed", run.Finished.GetProperty("status").GetString());
            Assert.Equal(JsonValueKind.Null, run.Finished.GetProperty("error").ValueKind);

            var batch = Assert.Single(run.Batches);
            Assert.True(batch.GetProperty("isFirstBatch").GetBoolean());
            Assert.True(batch.GetProperty("isLastBatch").GetBoolean());
            var field = Assert.Single(batch.GetProperty("fields").EnumerateArray());
            Assert.Equal("QUERY PLAN", field.GetProperty("fieldName").GetString());
            Assert.Equal("Json", field.GetProperty("category").GetString());

            var row = Assert.Single(batch.GetProperty("rows").EnumerateArray());
            var cell = Assert.Single(row.EnumerateArray());
            Assert.Equal(JsonValueKind.String, cell.ValueKind);
            using var plan = JsonDocument.Parse(cell.GetString()!);
            Assert.Equal(JsonValueKind.Array, plan.RootElement.ValueKind);
            Assert.True(plan.RootElement[0].GetProperty("Plan").TryGetProperty("Node Type", out _));
            Assert.False(plan.RootElement[0].TryGetProperty("Execution Time", out _));
        }

        [Fact]
        public async Task Analyze_adds_real_times()
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            using var signedIn = session;
            var connectionId = await session.ConnectAsync();
            await using var hub = await session.ListenAsync();

            var run = await session.RunAsync(connectionId, Query, hub, plan: "Analyze");

            Assert.Equal("Completed", run.Finished.GetProperty("status").GetString());
            using var plan = JsonDocument.Parse(PlanCell(run));
            Assert.True(plan.RootElement[0].TryGetProperty("Execution Time", out _));
            Assert.True(plan.RootElement[0].GetProperty("Plan").TryGetProperty("Actual Loops", out _));
        }

        [Fact]
        public async Task Analyze_rolls_back_what_the_statement_changed()
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            using var signedIn = session;
            var connectionId = await session.ConnectAsync();
            await using var hub = await session.ListenAsync();
            var table = $"plan_rollback_{Guid.NewGuid():N}";

            Assert.Equal("Completed", Status(await session.RunAsync(connectionId, $"create table {table} (id int)", hub)));
            try
            {
                var analyzed = await session.RunAsync(connectionId, $"insert into {table} values (1)", hub, plan: "Analyze");
                Assert.Equal("Completed", Status(analyzed));

                var count = await session.RunAsync(connectionId, $"select count(*)::int from {table}", hub);
                Assert.Equal("Completed", Status(count));
                var row = Assert.Single(count.Batches.SelectMany(batch => batch.GetProperty("rows").EnumerateArray()));
                Assert.Equal(0, row[0].GetInt32());
            }
            finally
            {
                await session.RunAsync(connectionId, $"drop table {table}", hub);
            }
        }

        [Fact]
        public async Task A_plan_of_two_statements_fails_with_a_message()
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            using var signedIn = session;
            var connectionId = await session.ConnectAsync();
            await using var hub = await session.ListenAsync();

            var run = await session.RunAsync(connectionId, "select 1; select 2", hub, plan: "Estimate");

            Assert.Equal("Failed", Status(run));
            Assert.Equal("Explain works on one statement at a time. Select the statement you want to explain.",
                run.Finished.GetProperty("error").GetString());
        }

        [Fact]
        public async Task Explain_of_an_explain_fails_with_a_message()
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            using var signedIn = session;
            var connectionId = await session.ConnectAsync();
            await using var hub = await session.ListenAsync();

            var run = await session.RunAsync(connectionId, "explain select 1", hub, plan: "Estimate");

            Assert.Equal("Failed", Status(run));
            Assert.StartsWith("This is already an EXPLAIN statement.", run.Finished.GetProperty("error").GetString());
        }

        [Fact]
        public async Task An_error_in_an_explained_statement_points_into_the_statement()
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            using var signedIn = session;
            var connectionId = await session.ConnectAsync();
            await using var hub = await session.ListenAsync();
            // The leading line break and spaces are not part of the statement's text; the EXPLAIN put in front is
            // not part of the script. Both must be taken out of PostgreSQL's position.
            var sql = "\n  select * from no_such_table";

            var run = await session.RunAsync(connectionId, sql, hub, plan: "Estimate");

            Assert.Equal("Failed", Status(run));
            Assert.Equal(sql.IndexOf("no_such_table", StringComparison.Ordinal), run.Finished.GetProperty("errorOffset").GetInt32());
        }

        [Fact]
        public async Task An_unknown_plan_value_is_refused()
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            using var signedIn = session;
            var connectionId = await session.ConnectAsync();

            var response = await session.PostExecuteAsync(connectionId, Query, Guid.NewGuid().ToString(), plan: "Bogus");

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        private static string? Status(QueryRun run) => run.Finished.GetProperty("status").GetString();

        private static string PlanCell(QueryRun run) => run.Batches[0].GetProperty("rows")[0][0].GetString()!;
    }
}
