namespace MDBNavigator.Workbench.Application.Queries
{
    public interface IBatchNotifier
    {
        // Sent before each statement of a script, so the client can say which one is running.
        Task SendStatementStarted(StatementStartedDto statement, string sessionId);

        Task SendBatchCommandResult(DatabaseCommandBatchResultDto command, string sessionId);

        // Sent exactly once per execution, after the last batch (or without any batch on failure).
        Task SendCommandFinished(CommandFinishedDto result, string sessionId);
    }
}
