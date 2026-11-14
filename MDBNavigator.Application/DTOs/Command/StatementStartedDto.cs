namespace MDBNavigator.Application.DTOs.Command
{
    public class StatementStartedDto
    {
        public required string ExecutionId { get; init; }
        public required int StatementIndex { get; init; }
        public required int StatementCount { get; init; }
        public required int Line { get; init; }
    }
}
