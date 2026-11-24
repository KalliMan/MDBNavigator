using MDBNavigator.Providers.Abstractions;

namespace MDBNavigator.Providers.PostgreSQL
{
    // The EXPLAIN statement for a plan request.
    // Rules:
    // - The script must be exactly one statement (a script of only comments has none).
    // - A statement that already starts with EXPLAIN is refused: EXPLAIN can't be nested, and its own output is not a plan.
    // - The options are fixed. Explain: FORMAT JSON. Explain Analyze adds ANALYZE and BUFFERS. No VERBOSE, SETTINGS or
    //   WAL: they make the details long and add little here.
    internal static class PostgresExplain
    {
        public const string NoStatementMessage = "There is no statement to explain.";
        public const string SeveralStatementsMessage = "Explain works on one statement at a time. Select the statement you want to explain.";
        public const string AlreadyExplainMessage = "This is already an EXPLAIN statement. Remove EXPLAIN to see its plan here, or use Run.";

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

            // The line break is on purpose: the statement's text may start with a -- comment, which would otherwise
            // swallow the rest of the line. The splitter has already dropped the ending semicolon.
            var options = analyze ? "ANALYZE, BUFFERS, FORMAT JSON" : "FORMAT JSON";
            var prefix = $"EXPLAIN ({options})\n";
            return (prefix + statement.Text, statement.Line, statement.Offset, prefix.Length);
        }
    }
}
