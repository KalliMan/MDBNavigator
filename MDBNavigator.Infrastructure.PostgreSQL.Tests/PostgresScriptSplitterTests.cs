namespace MDBNavigator.Infrastructure.PostgreSQL.Tests
{
    public class PostgresScriptSplitterTests
    {
        private static string[] Texts(string script) =>
            PostgresScriptSplitter.Split(script).Select(s => s.Text).ToArray();

        private static int[] Lines(string script) =>
            PostgresScriptSplitter.Split(script).Select(s => s.Line).ToArray();

        [Fact]
        public void One_statement_without_semicolon()
        {
            var result = PostgresScriptSplitter.Split("SELECT 1");

            var statement = Assert.Single(result);
            Assert.Equal("SELECT 1", statement.Text);
            Assert.Equal(1, statement.Line);
        }

        [Fact]
        public void Trailing_semicolon_is_not_part_of_the_text()
        {
            Assert.Equal(new[] { "SELECT 1" }, Texts("SELECT 1;"));
        }

        [Fact]
        public void Two_statements()
        {
            Assert.Equal(new[] { "SELECT 1", "SELECT 2" }, Texts("SELECT 1; SELECT 2;"));
        }

        [Fact]
        public void Texts_are_trimmed_and_lines_point_at_the_first_character()
        {
            var script = "  \n\nSELECT 1;\n\n  SELECT 2  \n";

            Assert.Equal(new[] { "SELECT 1", "SELECT 2" }, Texts(script));
            Assert.Equal(new[] { 3, 5 }, Lines(script));
        }

        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData(";")]
        [InlineData(";;;")]
        [InlineData("-- only a comment")]
        [InlineData("/* c */ ;")]
        public void Scripts_without_a_statement_give_nothing(string script)
        {
            Assert.Empty(PostgresScriptSplitter.Split(script));
        }

        [Fact]
        public void A_trailing_comment_is_not_a_statement()
        {
            Assert.Single(PostgresScriptSplitter.Split("SELECT 1; -- done"));
        }

        [Fact]
        public void A_leading_comment_is_part_of_the_text_but_not_of_the_line()
        {
            var result = PostgresScriptSplitter.Split("-- about\nSELECT 1");

            var statement = Assert.Single(result);
            Assert.Equal("-- about\nSELECT 1", statement.Text);
            Assert.Equal(2, statement.Line);
        }

        [Fact]
        public void Semicolon_in_a_string_does_not_split()
        {
            var result = Texts("SELECT 'a;b'; SELECT 2");

            Assert.Equal(2, result.Length);
            Assert.Equal("SELECT 'a;b'", result[0]);
        }

        [Fact]
        public void Doubled_quote_stays_inside_the_string()
        {
            Assert.Equal(2, Texts("SELECT 'it''s; fine'; SELECT 2").Length);
        }

        [Fact]
        public void Backslash_quote_stays_inside_an_escape_string()
        {
            Assert.Equal(2, Texts("SELECT E'it\\'s; fine'; SELECT 2").Length);
        }

        [Fact]
        public void Backslash_is_an_ordinary_character_in_a_plain_string()
        {
            Assert.Equal(2, Texts("SELECT 'ends with a backslash\\'; SELECT 2").Length);
        }

        [Fact]
        public void Escaped_backslash_in_an_escape_string_then_the_closing_quote()
        {
            Assert.Equal(2, Texts("SELECT e'\\\\'; SELECT 2").Length);
        }

        [Fact]
        public void An_e_that_is_not_directly_before_the_quote_does_not_make_an_escape_string()
        {
            Assert.Equal(2, Texts("SELECT 'a' AS e, 'b\\'; SELECT 2").Length);
        }

        [Fact]
        public void Semicolon_in_a_quoted_identifier_does_not_split()
        {
            Assert.Equal(2, Texts("SELECT \"a;b\" FROM t; SELECT 2").Length);
        }

        [Fact]
        public void Semicolon_in_a_dollar_quote_does_not_split()
        {
            Assert.Equal(2, Texts("SELECT $$a;b$$; SELECT 2").Length);
        }

        [Fact]
        public void Tagged_dollar_quote_hides_the_semicolons_of_a_do_block()
        {
            Assert.Equal(2, Texts("DO $body$ BEGIN PERFORM 1; END $body$; SELECT 2").Length);
        }

        [Fact]
        public void An_inner_dollar_tag_of_another_name_does_not_close_the_outer_one()
        {
            Assert.Equal(2, Texts("SELECT $a$ $b$ ; $b$ ; $a$; SELECT 2").Length);
        }

        [Fact]
        public void Dollar_parameters_and_dollars_inside_words_are_ordinary()
        {
            Assert.Equal(3, Texts("SELECT $1; SELECT a$b; SELECT 3").Length);
        }

        [Fact]
        public void Semicolon_in_a_line_comment_does_not_split()
        {
            var result = Texts("SELECT 1 -- c; no split\n; SELECT 2");

            Assert.Equal(2, result.Length);
            Assert.Equal("SELECT 1 -- c; no split", result[0]);
        }

        [Fact]
        public void Block_comments_nest()
        {
            Assert.Equal(2, Texts("SELECT 1 /* a; /* nested; */ still; */ ; SELECT 2").Length);
        }

        [Fact]
        public void Semicolons_inside_parentheses_do_not_split()
        {
            var script = "CREATE RULE r AS ON INSERT TO t DO ALSO (INSERT INTO a VALUES (1); INSERT INTO b VALUES (2)); SELECT 2";

            Assert.Equal(2, Texts(script).Length);
        }

        [Fact]
        public void Begin_atomic_function_body_stays_in_one_statement()
        {
            var script = "CREATE FUNCTION f() RETURNS int LANGUAGE sql BEGIN ATOMIC SELECT 1; SELECT 2; END; SELECT 3";

            var result = Texts(script);

            Assert.Equal(2, result.Length);
            Assert.EndsWith("END", result[0]);
        }

        [Fact]
        public void Case_inside_a_begin_atomic_body_is_balanced()
        {
            var script = "create or replace procedure p() language sql begin atomic select case when true then 1 else 2 end; end; select 3";

            Assert.Equal(2, Texts(script).Length);
        }

        [Fact]
        public void A_top_level_begin_is_not_a_routine_body()
        {
            Assert.Equal(3, Texts("BEGIN; UPDATE t SET a = 1; COMMIT;").Length);
        }

        [Fact]
        public void Case_outside_a_routine_does_not_hold_back_the_split()
        {
            Assert.Equal(2, Texts("SELECT CASE WHEN true THEN 1 END; SELECT 2").Length);
        }

        [Fact]
        public void Windows_line_endings_count_lines_once()
        {
            Assert.Equal(new[] { 1, 2, 4 }, Lines("SELECT 1;\r\nSELECT 2;\r\n\r\nSELECT 3"));
        }

        [Fact]
        public void Unterminated_string_runs_to_the_end()
        {
            Assert.Single(PostgresScriptSplitter.Split("SELECT 'abc; SELECT 2"));
        }

        [Fact]
        public void Unterminated_block_comment_runs_to_the_end()
        {
            Assert.Single(PostgresScriptSplitter.Split("SELECT 1; /* open"));
        }

        [Fact]
        public void Non_ascii_text_in_a_string()
        {
            Assert.Equal(2, Texts("SELECT 'Здравей; свят'; SELECT 2").Length);
        }

        [Fact]
        public void Leading_words_skip_parentheses()
        {
            var statement = Assert.Single(PostgresScriptSplitter.Split("(select 1) union all (select 2)"));

            Assert.Equal(new[] { "SELECT", "UNION", "ALL", "SELECT" }, statement.LeadingWords);
            Assert.Equal(1, statement.Line);
        }

        [Fact]
        public void Words_in_strings_identifiers_and_comments_are_not_data_changing()
        {
            var statement = Assert.Single(PostgresScriptSplitter.Split("select \"update\", 'delete' from t -- insert"));

            Assert.False(statement.HasDataChangingWord);
        }

        [Fact]
        public void A_data_changing_word_inside_a_cte_is_found()
        {
            var statement = Assert.Single(PostgresScriptSplitter.Split("with d as (delete from t returning *) select * from d"));

            Assert.True(statement.HasDataChangingWord);
            Assert.Equal(new[] { "WITH", "D", "AS", "DELETE" }, statement.LeadingWords);
        }

        [Fact]
        public void Numbers_are_not_words()
        {
            var statement = Assert.Single(PostgresScriptSplitter.Split("select 1e5 from t"));

            Assert.Equal(new[] { "SELECT", "FROM", "T" }, statement.LeadingWords);
        }
    }
}
