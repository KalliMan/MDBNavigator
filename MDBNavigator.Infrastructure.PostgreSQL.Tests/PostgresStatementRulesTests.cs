namespace MDBNavigator.Infrastructure.PostgreSQL.Tests
{
    public class PostgresStatementRulesTests
    {
        private static ScriptStatement Parse(string sql) => PostgresScriptSplitter.Split(sql)[0];

        [Theory]
        [InlineData("SELECT * FROM t")]
        [InlineData("select 1")]
        [InlineData("TABLE t")]
        [InlineData("VALUES (1)")]
        [InlineData("WITH a AS (SELECT 1) SELECT * FROM a")]
        [InlineData("(SELECT 1) UNION (SELECT 2)")]
        [InlineData("SHOW ALL")]
        public void A_plain_read_outside_a_transaction_can_be_cancelled(string sql)
        {
            Assert.True(PostgresStatementRules.CanCancelAtRowLimit(Parse(sql), inTransaction: false));
        }

        [Theory]
        [InlineData("SELECT * FROM t")]
        [InlineData("select 1")]
        [InlineData("TABLE t")]
        [InlineData("VALUES (1)")]
        [InlineData("WITH a AS (SELECT 1) SELECT * FROM a")]
        [InlineData("(SELECT 1) UNION (SELECT 2)")]
        [InlineData("SHOW ALL")]
        public void Nothing_is_cancelled_inside_a_transaction(string sql)
        {
            Assert.False(PostgresStatementRules.CanCancelAtRowLimit(Parse(sql), inTransaction: true));
        }

        [Theory]
        [InlineData("UPDATE t SET a = 1 RETURNING *")]
        [InlineData("WITH d AS (DELETE FROM t RETURNING *) SELECT * FROM d")]
        [InlineData("SELECT * FROM t FOR UPDATE")]
        [InlineData("EXPLAIN SELECT 1")]
        [InlineData("CALL p()")]
        [InlineData("EXECUTE q")]
        [InlineData("FETCH ALL FROM c")]
        public void Anything_that_may_change_data_or_is_unknown_is_not_cancelled(string sql)
        {
            Assert.False(PostgresStatementRules.CanCancelAtRowLimit(Parse(sql), inTransaction: false));
        }

        [Theory]
        [InlineData("BEGIN")]
        [InlineData("begin isolation level serializable")]
        [InlineData("START TRANSACTION")]
        public void Begin_opens_a_transaction(string sql)
        {
            Assert.True(PostgresStatementRules.InTransactionAfter(Parse(sql), inTransaction: false));
        }

        [Theory]
        [InlineData("COMMIT")]
        [InlineData("END")]
        [InlineData("ROLLBACK")]
        [InlineData("ABORT")]
        [InlineData("COMMIT WORK")]
        [InlineData("END TRANSACTION")]
        public void Commit_and_rollback_close_it(string sql)
        {
            Assert.False(PostgresStatementRules.InTransactionAfter(Parse(sql), inTransaction: true));
        }

        [Theory]
        [InlineData("ROLLBACK TO SAVEPOINT a")]
        [InlineData("ROLLBACK TO a")]
        [InlineData("COMMIT AND CHAIN")]
        [InlineData("ROLLBACK WORK AND CHAIN")]
        [InlineData("SAVEPOINT a")]
        [InlineData("SELECT 1")]
        public void These_leave_an_open_transaction_open(string sql)
        {
            Assert.True(PostgresStatementRules.InTransactionAfter(Parse(sql), inTransaction: true));
        }

        [Theory]
        [InlineData("SELECT 1")]
        [InlineData("SAVEPOINT a")]
        [InlineData("COMMIT")]
        public void These_do_not_open_a_transaction(string sql)
        {
            Assert.False(PostgresStatementRules.InTransactionAfter(Parse(sql), inTransaction: false));
        }
    }
}
