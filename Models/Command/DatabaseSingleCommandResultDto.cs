namespace Models.Command
{

    public class DatabaseSingleCommandResultDto : DatabaseCommandResultBase
    {
        public int RecordsAffected { get; init; }
        public int RowCount { get; init; }
        public required IEnumerable<DatabaseCommandResultFieldDto> Fields { get; init; }
    }
}
