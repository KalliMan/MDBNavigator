namespace MDBNavigator.Providers.Abstractions.Queries
{
    // What IQueryRunner.StreamQuery yields, in order: a StatementStarted before each statement,
    // then the batches of that statement's result set, if it has one.
    public abstract class QueryStreamItem
    {
    }

    public sealed class StatementStarted : QueryStreamItem
    {
        // Position in the script, from 0. Also the ResultSetIndex of the statement's batches.
        public required int StatementIndex { get; init; }
        public required int StatementCount { get; init; }
        // 1-based line of the statement in the script.
        public required int Line { get; init; }
        // Where the statement's text starts in the script: a 0-based index, in UTF-16 code units (what a .NET string counts in).
        public required int Offset { get; init; }
        // How many characters the provider put in front of the statement's text before sending it (EXPLAIN ...); 0 for a
        // plain run. The database counts them in an error's position, so IDatabaseErrorDescriber takes them off again.
        // The provider only puts ASCII there, so characters and UTF-16 units are the same number.
        public int PrefixLength { get; init; }
    }
}
