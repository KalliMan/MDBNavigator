using MDBNavigator.API.Tests.Infrastructure;
using System.Text.Json;

namespace MDBNavigator.API.Tests
{
    // The run limits a public demo sets (QueryExecution:MaxRowBytes, MaxRunSeconds, MaxRowsPerRun), scaled down in
    // LimitsAppFixture. Each fact signs in a fresh user, connects, and listens on the hub before it starts a query.
    [Collection(LimitsCollection.Name)]
    public class QueryLimitTests
    {
        private readonly LimitsAppFixture _fixture;

        public QueryLimitTests(LimitsAppFixture fixture) => _fixture = fixture;

        [Fact]
        public async Task A_large_text_value_keeps_its_beginning_and_says_it_was_cut()
        {
            var run = await RunAsync("select 1 as n, repeat('x', 200000) as big, true as b");

            Assert.Equal("Completed", Status(run));
            var row = Assert.Single(Rows(run));
            Assert.Equal(1, row[0].GetInt32());
            Assert.Equal(new string('x', 1000) + "… [cut: 196 KB in total]", row[1].GetString());
            Assert.True(row[2].GetBoolean());
        }

        [Fact]
        public async Task A_large_binary_value_shows_only_its_size()
        {
            var run = await RunAsync("select decode(repeat('ab', 100000), 'hex') as bin");

            Assert.Equal("Completed", Status(run));
            var row = Assert.Single(Rows(run));
            Assert.Equal("[too large to show: 98 KB]", row[0].GetString());
        }

        [Fact]
        public async Task Small_values_are_never_cut()
        {
            // a fits in the row's 64 KB; b is 1 KB, which is never cut, although the row has no room left.
            var run = await RunAsync("select repeat('a', 65000) as a, repeat('b', 1000) as b, 7 as c");

            Assert.Equal("Completed", Status(run));
            var row = Assert.Single(Rows(run));
            Assert.Equal(new string('a', 65000), row[0].GetString());
            Assert.Equal(new string('b', 1000), row[1].GetString());
            Assert.Equal(7, row[2].GetInt32());
        }

        [Fact]
        public async Task Wide_rows_come_in_smaller_batches()
        {
            var run = await RunAsync("select repeat('x', 30000) from generate_series(1, 50)");

            Assert.Equal("Completed", Status(run));
            Assert.Equal(50, Rows(run).Count);
            // 35 × 30,000 bytes is the first total of at least 1 MB (1,048,576), so the first batch ends there.
            Assert.Equal(2, run.Batches.Count);
            Assert.Equal(35, run.Batches[0].GetProperty("rows").GetArrayLength());
        }

        [Fact]
        public async Task A_run_stops_at_its_time_limit()
        {
            var run = await RunAsync("select pg_sleep(10)");

            Assert.Equal("Failed", Status(run));
            Assert.Equal("Stopped after 3 seconds, this server's time limit for one run.", run.Finished.GetProperty("error").GetString());
            Assert.True(run.Finished.GetProperty("elapsedMs").GetInt64() < 8000);
        }

        [Fact]
        public async Task A_script_stops_after_more_rows_than_the_run_limit()
        {
            var run = await RunAsync("select * from generate_series(1, 60);\nselect * from generate_series(1, 60);\nselect 1;");

            Assert.Equal("Failed", Status(run));
            Assert.Equal(
                "Statement 2 of 3 (line 2): Stopped after more than 100 rows in total, this server's row limit for one run; the rest of the script was not run.",
                run.Finished.GetProperty("error").GetString());
            // The third statement never started.
            Assert.Equal(2, run.Statements.Count);
            Assert.Equal(120, run.Finished.GetProperty("rowCount").GetInt32());
        }

        [Fact]
        public async Task One_result_at_the_row_limit_is_not_stopped()
        {
            var run = await RunAsync("select * from generate_series(1, 1000)");

            Assert.Equal("Completed", Status(run));
            Assert.True(run.Finished.GetProperty("truncated").GetBoolean());
            Assert.Equal(LimitsAppFixture.MaxRowsPerResultSet, run.Finished.GetProperty("rowCount").GetInt32());
        }

        [Fact]
        public async Task A_plan_larger_than_the_row_limit_is_refused()
        {
            // The plan repeats the 20,000 values in its filter, far over the row limit of 64 KB. A cut JSON cannot be
            // read, so the plan is refused with a message instead.
            var sql = $"select * from smoke_items where id in ({string.Join(", ", Enumerable.Range(1, 20000))})";

            var run = await RunAsync(sql, plan: "Estimate");

            Assert.Equal("Failed", Status(run));
            Assert.Contains("per row (QueryExecution:MaxRowBytes)", run.Finished.GetProperty("error").GetString());
        }

        private async Task<QueryRun> RunAsync(string sql, string? plan = null)
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            using var signedIn = session;
            var connectionId = await session.ConnectAsync();
            await using var hub = await session.ListenAsync();
            return await session.RunAsync(connectionId, sql, hub, plan);
        }

        private static string? Status(QueryRun run) => run.Finished.GetProperty("status").GetString();

        private static List<JsonElement[]> Rows(QueryRun run) => run.Batches
            .SelectMany(batch => batch.GetProperty("rows").EnumerateArray())
            .Select(row => row.EnumerateArray().ToArray())
            .ToList();
    }
}
