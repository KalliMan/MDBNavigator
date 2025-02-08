using MDBNavigator.BL.BatchCommandResultHub;
using Models.Command;

namespace MDBNavigator.API.SignalRHub
{
    public class BatchCommandResultHubProxy : IBatchCommandResultHubProxy
    {
        BatchCommandResultHub _batchCommandResultHub;

        public BatchCommandResultHubProxy(BatchCommandResultHub batchCommandResultHub)
        {
            this._batchCommandResultHub = batchCommandResultHub;
        }

        public async Task SendBatchCommandResult(DatabaseCommandBatchResultDto command, string applicationId)
        {
//            _hubContext.Clients.Client(_hubContext.Context.ConnectionId)
//            await _hubContext.Clients.All.SendAsync("ReceiveBatchCommandResult", command);
            await _batchCommandResultHub.SendBatchCommandResult(command, applicationId);
        }
    }
}
