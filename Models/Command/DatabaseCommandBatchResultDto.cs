namespace Models.Command
{
    public class DatabaseCommandBatchResultDto : DatabaseCommandResultBase
    {
        public required string CommandId { get; init; }
        public int Index { get; init; }
    }
}
