namespace MDBNavigator.Workbench.Application.Queries
{
    public class DatabaseCommandBatchResultDto
    {
        // "{executionId}_{resultSetIndex}": identifies the result set the batch belongs to.
        public required string Id { get; init; }
        public required string ExecutionId { get; init; }
        public int Index { get; init; }
        public int ResultSetIndex { get; init; }
        public bool IsFirstBatch { get; init; }
        public bool IsLastBatch { get; init; }
        public IEnumerable<DatabaseCommandResultFieldDto>? Fields { get; init; }
        // Row values, already JSON-friendly: the provider converts every cell (PostgreSQL: JsonCellValue.From);
        // the UI's CellValue type describes the possible shapes.
        public required IReadOnlyList<object?[]> Rows { get; init; }
        // Last batch only: the result set stopped at the row limit.
        public bool Truncated { get; init; }
        // Last batch only: the server is still reading the statement's remaining rows away.
        public bool SkippingRest { get; init; }
    }
}
