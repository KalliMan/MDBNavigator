using MDBNavigator.Application.DTOs.Command;

namespace MDBNavigator.Application.Contracts
{
    public interface IBatchNotifier
    {
        Task SendBatchCommandResult(DatabaseCommandBatchResultDto command, string sessionId);

        // Sent exactly once per execution, after the last batch (or without any batch on failure).
        Task SendCommandFinished(CommandFinishedDto result, string sessionId);
    }
}
