using MDBNavigator.Providers.Abstractions.Queries;

namespace MDBNavigator.Providers.Abstractions
{
    public interface IQueryRunner
    {
        // Runs the script statement by statement on this provider's connection. Each statement commits on its own
        // unless the script opens a transaction. The first failing statement ends the stream with its exception.
        // commandTimeoutSeconds: per statement; null keeps the provider default, 0 means no timeout.
        // maxRowsPerResultSet: a longer result set stops there (its last batch says Truncated); the script goes on.
        // maxRowBytes: bytes of values read per row; a value that would go past it arrives cut, as a string (CutCellText).
        // stats is filled while the stream is consumed (row count, records affected, truncated).
        IAsyncEnumerable<QueryStreamItem> StreamQuery(
            string script,
            int batchSize,
            int? commandTimeoutSeconds = null,
            int? maxRowsPerResultSet = null,
            int? maxRowBytes = null,
            QueryStreamStats? stats = null,
            CancellationToken ct = default);

        // The plan of one statement, in the provider's own format (PostgreSQL: EXPLAIN's JSON). Yields one StatementStarted
        // (statement 0 of 1) and one QueryBatch: first and last, one column "QUERY PLAN" of category Json, one row whose value
        // is the plan as a string. analyze: the statement really runs, inside a transaction that is rolled back afterwards.
        // Throws InvalidScriptException before anything runs when the script is not exactly one statement that can be explained,
        // and when the plan is larger than maxRowBytes.
        IAsyncEnumerable<QueryStreamItem> StreamPlan(
            string script,
            bool analyze,
            int? commandTimeoutSeconds = null,
            int? maxRowBytes = null,
            CancellationToken ct = default);
    }
}
