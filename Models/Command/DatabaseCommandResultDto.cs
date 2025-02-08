namespace Models.Command
{
    public class DatabaseCommandBatchResultBase
    {
        public required string Id { get; init; }
        public string ResultJson { get; init; } = string.Empty;
    }
    public class DatabaseCommandBatchResultDto : DatabaseCommandBatchResultBase
    {
        public int Index { get; init; }
    }

    public class DatabaseCommandResultDto : DatabaseCommandBatchResultBase
    {
        public int RecordsAffected { get; init; }
        public int RowCount { get; init; }
        public required IEnumerable<DatabaseCommandResultFieldDto> Fields { get; init; }
    }
}
