using Models;

namespace MDBNavigator.BL.SignalR
{
    public interface IBatchCommandResultHub
    {
        Task ReceiveBatchCommandResult(DatabaseCommandBatchResultDto command);
    }
}
