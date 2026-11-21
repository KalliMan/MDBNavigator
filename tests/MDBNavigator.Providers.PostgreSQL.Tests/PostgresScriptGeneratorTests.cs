using Npgsql;

namespace MDBNavigator.Providers.PostgreSQL.Tests
{
    // The scripts built in C#. The generator's connection is never opened: these methods don't use it.
    // QuoteIdentifier is private; it is tested through the public methods that use it.
    public class PostgresScriptGeneratorTests
    {
        private static PostgresScriptGenerator Generator() => new(new NpgsqlConnection());

        [Fact]
        public void A_plain_name_is_quoted()
        {
            Assert.Equal("DROP TABLE \"public\".\"users\";", Generator().GetDropTableScript("public", "users"));
        }

        [Fact]
        public void Case_and_spaces_are_kept()
        {
            Assert.Equal("DROP TABLE \"Sales Data\".\"OrderItems\";", Generator().GetDropTableScript("Sales Data", "OrderItems"));
        }

        [Fact]
        public void An_embedded_double_quote_is_doubled()
        {
            Assert.Equal("DROP TABLE \"a\"\"b\".\"t\";", Generator().GetDropTableScript("a\"b", "t"));
        }

        [Fact]
        public void An_injection_attempt_stays_one_identifier()
        {
            Assert.Equal(
                "DROP TABLE \"public\".\"x\"\"; DROP TABLE t; --\";",
                Generator().GetDropTableScript("public", "x\"; DROP TABLE t; --"));
        }

        [Fact]
        public void Non_ASCII_names_are_kept()
        {
            Assert.Equal("DROP VIEW \"public\".\"Übersicht\";", Generator().GetDropViewScript("public", "Übersicht"));
        }

        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData("a\0b")]
        public void An_invalid_schema_is_refused(string schema)
        {
            var ex = Assert.Throws<ArgumentException>(() => Generator().GetDropTableScript(schema, "t"));
            Assert.Equal("schema", ex.ParamName);
        }

        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData("a\0b")]
        public void An_invalid_table_name_is_refused(string name)
        {
            var ex = Assert.Throws<ArgumentException>(() => Generator().GetDropTableScript("public", name));
            Assert.Equal("name", ex.ParamName);
        }

        [Theory]
        [InlineData(null, "SELECT * FROM \"public\".\"t\"")]
        [InlineData(-1, "SELECT * FROM \"public\".\"t\"")]
        [InlineData(0, "SELECT * FROM \"public\".\"t\" LIMIT 0")]
        [InlineData(1000, "SELECT * FROM \"public\".\"t\" LIMIT 1000")]
        public void The_top_N_script_limits_only_for_zero_or_more(int? recordsNumber, string expected)
        {
            Assert.Equal(expected, Generator().GetTopNTableRecordsScript("public", "t", recordsNumber));
        }

        [Fact]
        public void The_templates_quote_the_schema()
        {
            var generator = Generator();

            Assert.StartsWith("CREATE OR REPLACE PROCEDURE \"my\"\"schema\".MyProcName(", generator.GetCreateStoredProcedureScript("my\"schema"));
            Assert.StartsWith("CREATE OR REPLACE FUNCTION \"my\"\"schema\".MyFuncName(", generator.GetCreateFunctionScript("my\"schema"));
            Assert.StartsWith("CREATE OR REPLACE VIEW \"my\"\"schema\".MyView AS", generator.GetCreateViewScript("my\"schema"));
            Assert.StartsWith("CREATE TABLE \"my\"\"schema\".\"MyTable\"", generator.GetCreateNewTableScript("my\"schema"));
        }

        [Fact]
        public void The_templates_refuse_an_empty_schema()
        {
            var generator = Generator();

            Assert.Throws<ArgumentException>(() => generator.GetCreateStoredProcedureScript(""));
            Assert.Throws<ArgumentException>(() => generator.GetCreateFunctionScript(""));
            Assert.Throws<ArgumentException>(() => generator.GetCreateViewScript(""));
            Assert.Throws<ArgumentException>(() => generator.GetCreateNewTableScript(""));
        }
    }
}
