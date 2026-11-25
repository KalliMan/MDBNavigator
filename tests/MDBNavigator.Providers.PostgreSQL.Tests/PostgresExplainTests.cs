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

        [Theory]
        [InlineData("create or replace procedure p() language plpgsql as $$ begin end $$")]
        [InlineData("create function f() returns int language sql as 'select 1'")]
        [InlineData("create index i on t (a)")]
        [InlineData("alter table t add column b int")]
        [InlineData("drop table t")]
        [InlineData("set search_path = public")]
        [InlineData("call p()")]
        [InlineData("vacuum t")]
        public void A_statement_explain_cant_take_is_refused(string script)
        {
            var ex = Assert.Throws<InvalidScriptException>(() => PostgresExplain.Build(script, analyze: false));

            Assert.Equal(PostgresExplain.NotExplainableMessage, ex.Message);
        }

        [Theory]
        [InlineData("select 1")]
        [InlineData("(select 1)")]
        [InlineData("with x as (select 1) select * from x")]
        [InlineData("table t")]
        [InlineData("values (1), (2)")]
        [InlineData("insert into t values (1)")]
        [InlineData("update t set a = 1")]
        [InlineData("delete from t")]
        [InlineData("merge into t using s on t.a = s.a when matched then delete")]
        [InlineData("execute q(1)")]
        [InlineData("declare c cursor for select 1")]
        [InlineData("create table t2 as select * from t")]
        [InlineData("create temp table t2 as select * from t")]
        [InlineData("create unlogged table t2 as select * from t")]
        [InlineData("create materialized view v as select * from t")]
        public void A_statement_explain_can_take_is_built(string script)
        {
            var (text, _, _, _) = PostgresExplain.Build(script, analyze: false);

            Assert.EndsWith(script, text);
        }
    }
}
