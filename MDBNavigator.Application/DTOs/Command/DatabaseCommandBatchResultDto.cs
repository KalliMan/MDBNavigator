namespace MDBNavigator.Application.DTOs.Command
{
    public class DatabaseCommandBatchResultDto : DatabaseCommandResultBase
    {
        public required string CommandId { get; init; }
        public required string ExecutionId { get; init; }
        public int Index { get; init; }
        public int ResultSetIndex { get; init; }
        public bool IsFirstBatch { get; init; }
        public bool IsLastBatch { get; init; }
        public IEnumerable<DatabaseCommandResultFieldDto>? Fields { get; init; }
    }
}
