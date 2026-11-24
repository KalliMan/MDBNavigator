namespace MDBNavigator.Workbench.Application.Queries
{
    public enum CommandExecutionStatus
    {
        Completed,
        Failed,
        Cancelled
    }

    public class CommandFinishedDto
    {
        public required string ExecutionId { get; init; }
        public required CommandExecutionStatus Status { get; init; }
        public long RowCount { get; init; }
        public int RecordsAffected { get; init; }
        public long ElapsedMs { get; init; }
        public bool Truncated { get; init; }
        public string? Error { get; init; }
        // A failed run whose error the database placed in the script: the 0-based index of that place in the script as
        // the browser sent it, in UTF-16 code units. null otherwise.
        public int? ErrorOffset { get; init; }
    }
}
