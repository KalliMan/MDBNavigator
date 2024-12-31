using Models;

namespace MDBNavigator.API.SignalR
{
    public interface IBatchCommandResultHub
    {
        Task ReceiveBatchCommandResult(DatabaseCommandBatchResultDto command);
    }
}
