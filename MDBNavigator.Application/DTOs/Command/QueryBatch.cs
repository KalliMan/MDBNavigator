using MDBNavigator.Domain.Enums;

namespace MDBNavigator.Application.DTOs.Command
{
    // DataTypeName: what the database calls the type ("jsonb", "numeric(10, 2)"). For display only.
    public record ColumnInfo(string Name, DbTypeCategory Category, string DataTypeName);

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
