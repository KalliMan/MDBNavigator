namespace MDBNavigator.Providers.Abstractions.Queries
{
    // DataTypeName: what the database calls the type ("jsonb", "numeric(10, 2)"). For display only.
    public record ColumnInfo(string Name, DbTypeCategory Category, string DataTypeName);

    public class QueryBatch : QueryStreamItem
    {
        public required int ResultSetIndex { get; init; }
        public required bool IsFirstBatch { get; init; }
        public required bool IsLastBatch { get; init; }
        public required int BatchIndex { get; init; }
        public IReadOnlyList<ColumnInfo>? Columns { get; init; }
        public required IReadOnlyList<object?[]> Rows { get; init; }
        // On the last batch only: the result set has more rows than the row limit, and stops here.
        public bool Truncated { get; init; }
        // On the last batch only, with Truncated: the provider is still reading the statement's remaining rows
        // (and throwing them away), so the next statement starts when that is done.
        public bool SkippingRest { get; init; }
    }
}
