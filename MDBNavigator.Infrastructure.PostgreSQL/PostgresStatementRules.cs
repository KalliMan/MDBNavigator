namespace MDBNavigator.Infrastructure.PostgreSQL
{
    public static class PostgresStatementRules
    {
        // Stopping a statement by cancelling it is an error for PostgreSQL: it undoes what the statement changed
        // and aborts an open transaction. That is harmless only for a statement that just reads, outside a
        // transaction. When in doubt the answer is no, and the caller reads the remaining rows away instead.
        public static bool CanCancelAtRowLimit(ScriptStatement statement, bool inTransaction)
        {
            if (inTransaction || statement.HasDataChangingWord || statement.LeadingWords.Count == 0)
            {
                return false;
            }
            return statement.LeadingWords[0] is "SELECT" or "TABLE" or "VALUES" or "WITH" or "SHOW";
        }

        // Whether a transaction block is open after the statement ran without error.
        // A wrong guess must land on "open": then a result is skipped where it could have been cancelled,
        // which is only slower. The opposite guess would cancel inside a transaction and abort it.
        public static bool InTransactionAfter(ScriptStatement statement, bool inTransaction)
        {
            var words = statement.LeadingWords;
            if (words.Count == 0)
            {
                return inTransaction;
            }

            if (words[0] == "BEGIN" || (words[0] == "START" && words.Count > 1 && words[1] == "TRANSACTION"))
            {
                return true;
            }

            if (words[0] is "COMMIT" or "END" or "ROLLBACK" or "ABORT")
            {
                // ROLLBACK TO a savepoint keeps the transaction; COMMIT AND CHAIN opens the next one at once.
                return inTransaction && (words.Contains("TO") || words.Contains("CHAIN"));
            }

            return inTransaction;
        }
    }
}
