using MDBNavigator.Application.DTOs.Command;

namespace MDBNavigator.Application.Contracts
{
    public interface IBatchNotifier
    {
        Task SendBatchCommandResult(DatabaseCommandBatchResultDto command, string applicationId);
    }
}
