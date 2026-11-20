using MDBNavigator.Providers.Abstractions;
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
    }
}
