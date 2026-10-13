namespace MDBNavigator.Application.DTOs.Command
{
    public record ColumnInfo(string Name, string TypeName, string FullTypeName);

    public class QueryBatch
    {
        public required int ResultSetIndex { get; init; }
        public required bool IsFirstBatch { get; init; }
        public required bool IsLastBatch { get; init; }
        public required int BatchIndex { get; init; }
        public IReadOnlyList<ColumnInfo>? Columns { get; init; }
        public required IReadOnlyList<object?[]> Rows { get; init; }
    }
}
