namespace Models
{
    public class DatabaseCommandBatchResultDto
    {
        public required string Id { get; init; }
        public int Index { get; init; }
        public required string ResultJson { get; init; }
    }

    public class DatabaseCommandResultDto : DatabaseCommandBatchResultDto
    {
        public int RecordsAffected { get; init; }
        public int RowCount { get; init; }
        public required IEnumerable<DatabaseCommandResultFieldDto> Fields { get; init; }
    }
}
