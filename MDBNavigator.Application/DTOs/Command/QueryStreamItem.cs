namespace MDBNavigator.Application.DTOs.Command
{
    // What IDatabaseProvider.StreamQuery yields, in order: a StatementStarted before each statement,
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
    }
}
