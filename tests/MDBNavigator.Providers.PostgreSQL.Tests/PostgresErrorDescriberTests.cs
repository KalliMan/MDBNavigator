using MDBNavigator.Providers.Abstractions;
using MDBNavigator.Providers.Abstractions.Queries;
using Npgsql;

namespace MDBNavigator.Providers.PostgreSQL.Tests
{
    // Which database errors the public demo counts against a guest (refusals and limits), and which it doesn't (mistakes).
    public class PostgresErrorDescriberTests
    {
        private static readonly PostgresErrorDescriber Describer = new();

        private static PostgresException Error(string sqlState) => new("message", "ERROR", "ERROR", sqlState);

        [Theory]
        [InlineData("42501")] // insufficient privilege
        [InlineData("25006")] // write in a read-only transaction
        public void Refused_rights_are_permission_errors(string sqlState)
        {
            Assert.Equal(DatabaseErrorKind.PermissionDenied, Describer.Classify(Error(sqlState)));
        }

        [Theory]
        [InlineData("57014")] // statement timeout
        [InlineData("53400")] // temp_file_limit
        [InlineData("53300")] // too many connections for the role
        public void Database_limits_are_limits(string sqlState)
        {
            Assert.Equal(DatabaseErrorKind.LimitReached, Describer.Classify(Error(sqlState)));
        }

        [Theory]
        [InlineData("42601")] // syntax error
        [InlineData("42P01")] // missing table
        [InlineData("23505")] // unique violation
        public void Mistakes_are_other(string sqlState)
        {
            Assert.Equal(DatabaseErrorKind.Other, Describer.Classify(Error(sqlState)));
        }

        [Fact]
        public void Errors_of_other_kinds_are_other()
        {
            Assert.Equal(DatabaseErrorKind.Other, Describer.Classify(new InvalidOperationException("not a database error")));
        }

        // An error with the fields the place and the message are built from.
        private static PostgresException ErrorAt(int position, string? detail = null, string? hint = null,
            string? internalQuery = null, string? where = null) =>
            new("message", "ERROR", "ERROR", "42P01", detail: detail, hint: hint, position: position,
                internalQuery: internalQuery, where: where);

        private static StatementStarted Statement(int offset = 0, int prefixLength = 0) =>
            new() { StatementIndex = 0, StatementCount = 1, Line = 1, Offset = offset, PrefixLength = prefixLength };

        [Fact]
        public void The_place_is_an_index_into_the_script()
        {
            var script = "select * from no_such_table";

            Assert.Equal(14, Describer.OffsetInScript(ErrorAt(15), script, Statement()));
        }

        [Fact]
        public void The_place_counts_from_the_statements_start()
        {
            var script = "select 1;\nselect * from nope";

            Assert.Equal(24, Describer.OffsetInScript(ErrorAt(15), script, Statement(offset: 10)));
        }

        [Fact]
        public void An_emoji_is_one_character_for_the_database_and_two_in_a_string()
        {
            var script = "select '😀' from no_such_table";

            Assert.Equal(script.IndexOf("no_such_table", StringComparison.Ordinal), Describer.OffsetInScript(ErrorAt(17), script, Statement()));
        }

        [Fact]
        public void What_the_provider_put_in_front_is_taken_off()
        {
            var script = "select * from no_such_table";

            Assert.Equal(14, Describer.OffsetInScript(ErrorAt(37), script, Statement(prefixLength: 22)));
        }

        [Fact]
        public void A_place_inside_what_the_provider_put_in_front_is_no_place()
        {
            var script = "select * from no_such_table";

            Assert.Null(Describer.OffsetInScript(ErrorAt(5), script, Statement(prefixLength: 22)));
        }

        [Fact]
        public void End_of_input_is_one_past_the_last_character()
        {
            var script = "select * from";

            Assert.Equal(13, Describer.OffsetInScript(ErrorAt(14), script, Statement()));
        }

        public static TheoryData<Exception, string> ErrorsWithoutAPlace() => new()
        {
            { ErrorAt(0), "select 1/0" },
            { ErrorAt(500), "select 1/0" },
            { new InvalidOperationException("x"), "select 1/0" },
        };

        [Theory]
        [MemberData(nameof(ErrorsWithoutAPlace))]
        public void No_place_gives_null(Exception exception, string script)
        {
            Assert.Null(Describer.OffsetInScript(exception, script, Statement()));
        }

        [Fact]
        public void Describe_adds_the_query_and_the_context()
        {
            var error = ErrorAt(0, detail: "d", hint: "h", internalQuery: "SELECT 1", where: "PL/pgSQL function f() line 3 at PERFORM");

            Assert.Equal(
                "42P01: message\nDETAIL: d\nHINT: h\nQUERY: SELECT 1\nCONTEXT: PL/pgSQL function f() line 3 at PERFORM",
                Describer.Describe(error));
        }
    }
}
