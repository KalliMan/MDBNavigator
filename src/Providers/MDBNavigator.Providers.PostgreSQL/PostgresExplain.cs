using MDBNavigator.Providers.Abstractions;

namespace MDBNavigator.Providers.PostgreSQL
{
    // The EXPLAIN statement for a plan request.
    // Rules:
    // - The script must be exactly one statement (a script of only comments has none).
    // - A statement that already starts with EXPLAIN is refused: EXPLAIN can't be nested, and its own output is not a plan.
    // - A statement EXPLAIN can't take is refused too (CREATE PROCEDURE, ALTER, DROP, SET, ...): PostgreSQL would answer
    //   with a bare "syntax error" placed on the statement's second word, which reads as if the statement were wrong.
    //   The check looks only at the leading words, so it lets through some statements PostgreSQL still refuses (a CREATE
    //   TABLE without AS): those get PostgreSQL's own error, as before.
    // - The options are fixed. Explain: FORMAT JSON. Explain Analyze adds ANALYZE and BUFFERS. No VERBOSE, SETTINGS or
    //   WAL: they make the details long and add little here.
    internal static class PostgresExplain
    {
        public const string NoStatementMessage = "There is no statement to explain.";
        public const string SeveralStatementsMessage = "Explain works on one statement at a time. Select the statement you want to explain.";
        public const string AlreadyExplainMessage = "This is already an EXPLAIN statement. Remove EXPLAIN to see its plan here, or use Run.";
        public const string NotExplainableMessage =
            "PostgreSQL has no plan for this kind of statement. Explain works on SELECT, INSERT, UPDATE, DELETE, MERGE, VALUES, EXECUTE, DECLARE and CREATE TABLE … AS. Use Run for this one.";

        // Text: the statement to send. Line: the statement's line in the script, for StatementStarted. Offset: where the
        // statement's own text starts in the script. PrefixLength: how many characters of Text come before it.
        public static (string Text, int Line, int Offset, int PrefixLength) Build(string script, bool analyze)
        {
            var statements = PostgresScriptSplitter.Split(script);
            if (statements.Count == 0)
            {
                throw new InvalidScriptException(NoStatementMessage);
            }
            if (statements.Count > 1)
            {
                throw new InvalidScriptException(SeveralStatementsMessage);
            }

            var statement = statements[0];
            if (statement.LeadingWords.Count > 0 && statement.LeadingWords[0] == "EXPLAIN")
            {
                throw new InvalidScriptException(AlreadyExplainMessage);
            }
            if (!CanBeExplained(statement.LeadingWords))
            {
                throw new InvalidScriptException(NotExplainableMessage);
            }

            // The line break is on purpose: the statement's text may start with a -- comment, which would otherwise
            // swallow the rest of the line. The splitter has already dropped the ending semicolon.
            var options = analyze ? "ANALYZE, BUFFERS, FORMAT JSON" : "FORMAT JSON";
            var prefix = $"EXPLAIN ({options})\n";
            return (prefix + statement.Text, statement.Line, statement.Offset, prefix.Length);
        }

        // The statements PostgreSQL's EXPLAIN accepts, by their first words. WITH and TABLE are queries too, and a
        // statement in parentheses, "(select 1)", has SELECT as its first word because brackets aren't words.
        // No words at all (not expected after the splitter) is left to PostgreSQL rather than refused here.
        private static bool CanBeExplained(IReadOnlyList<string> words)
        {
            if (words.Count == 0)
            {
                return true;
            }
            if (words[0] is "SELECT" or "WITH" or "TABLE" or "VALUES" or "INSERT" or "UPDATE" or "DELETE" or "MERGE"
                or "EXECUTE" or "DECLARE")
            {
                return true;
            }
            // CREATE [GLOBAL | LOCAL] [TEMP | TEMPORARY | UNLOGGED] TABLE ... AS, and CREATE MATERIALIZED VIEW ... AS.
            return words[0] == "CREATE" && words.Count > 1
                && words[1] is "TABLE" or "MATERIALIZED" or "TEMP" or "TEMPORARY" or "UNLOGGED" or "GLOBAL" or "LOCAL";
        }
    }
}
