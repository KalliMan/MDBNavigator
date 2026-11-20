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
    }
}
