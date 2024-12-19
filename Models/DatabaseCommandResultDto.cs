namespace Models
{
    public class DatabaseCommandBatchResultDto
    {
        public Guid Id { get; init; }
        public int Index { get; init; }
        public required string ResultJson { get; init; }
    }

    public class DatabaseCommandResultDto : DatabaseCommandBatchResultDto
    {
        public int RowCount { get; init; }
        public required IEnumerable<DatabaseCommandResultFieldDto> Fields { get; init; }
    }
}
