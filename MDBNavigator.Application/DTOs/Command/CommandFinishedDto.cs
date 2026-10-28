namespace MDBNavigator.Application.DTOs.Command
{
    public enum CommandExecutionStatus
    {
        Completed,
        Failed,
        Cancelled
    }

    public class CommandFinishedDto
    {
        public required string CommandId { get; init; }
        public required string ExecutionId { get; init; }
        public required CommandExecutionStatus Status { get; init; }
        public long RowCount { get; init; }
        public int RecordsAffected { get; init; }
        public long ElapsedMs { get; init; }
        public string? Error { get; init; }
    }
}
