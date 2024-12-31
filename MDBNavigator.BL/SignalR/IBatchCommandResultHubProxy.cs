using Models;

namespace MDBNavigator.BL.SignalR
{
    public interface IBatchCommandResultHubProxy
    {
        Task ReceiveBatchCommandResult(DatabaseCommandBatchResultDto command);
    }
}
