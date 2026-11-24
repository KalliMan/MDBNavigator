using MDBNavigator.Providers.Abstractions;

namespace MDBNavigator.Providers.PostgreSQL.Tests
{
    public class PostgresExplainTests
    {
        [Fact]
        public void A_statement_gets_the_explain_prefix_and_its_line()
        {
            var (text, line, _, _) = PostgresExplain.Build("select * from t", analyze: false);

            Assert.Equal("EXPLAIN (FORMAT JSON)\nselect * from t", text);
            Assert.Equal(1, line);
        }

        [Fact]
        public void Analyze_adds_analyze_and_buffers()
        {
            var (text, _, _, _) = PostgresExplain.Build("select * from t", analyze: true);

            Assert.Equal("EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)\nselect * from t", text);
        }

        [Fact]
        public void The_ending_semicolon_is_dropped()
        {
            var (text, _, _, _) = PostgresExplain.Build("select 1;", analyze: false);

            Assert.Equal("EXPLAIN (FORMAT JSON)\nselect 1", text);
        }

        [Fact]
        public void A_leading_comment_stays_after_the_line_break_and_the_line_skips_it()
        {
            var (text, line, _, _) = PostgresExplain.Build("\n\n  -- note\nselect 1", analyze: false);

            Assert.Equal("EXPLAIN (FORMAT JSON)\n-- note\nselect 1", text);
            Assert.Equal(4, line);
        }

        [Theory]
        [InlineData(false)]
        [InlineData(true)]
        public void The_prefix_length_is_what_was_put_in_front(bool analyze)
        {
            var (text, _, offset, prefixLength) = PostgresExplain.Build("select * from t", analyze);

            Assert.Equal(text.Length - "select * from t".Length, prefixLength);
            Assert.Equal("select * from t", text[prefixLength..]);
            Assert.Equal(0, offset);
        }

        [Fact]
        public void The_offset_is_where_the_statement_starts_in_the_script()
        {
            var (_, _, offset, _) = PostgresExplain.Build("\n\n  -- note\nselect 1", analyze: false);

            Assert.Equal(4, offset);
        }

        [Fact]
        public void Two_statements_are_refused()
        {
            var ex = Assert.Throws<InvalidScriptException>(() => PostgresExplain.Build("select 1; select 2", analyze: false));

            Assert.Equal(PostgresExplain.SeveralStatementsMessage, ex.Message);
        }

        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData("-- only a comment")]
        public void A_script_without_a_statement_is_refused(string script)
        {
            var ex = Assert.Throws<InvalidScriptException>(() => PostgresExplain.Build(script, analyze: false));

            Assert.Equal(PostgresExplain.NoStatementMessage, ex.Message);
        }

        [Theory]
        [InlineData("explain select 1")]
        [InlineData("EXPLAIN ANALYZE select 1")]
        public void An_explain_statement_is_refused(string script)
        {
            var ex = Assert.Throws<InvalidScriptException>(() => PostgresExplain.Build(script, analyze: false));

            Assert.Equal(PostgresExplain.AlreadyExplainMessage, ex.Message);
        }
    }
}
