using MDBNavigator.BL.SignalR;
using Microsoft.AspNetCore.SignalR;
using Models;

namespace MDBNavigator.API.SignalR
{
    public class BatchCommandResultHubProxy : IBatchCommandResultHubProxy
    {
        IHubContext<BatchCommandResultHub> _hubContext;
        //        BatchCommandResultHub hub2;

        public BatchCommandResultHubProxy(IHubContext<BatchCommandResultHub> hubContext)
        {
            _hubContext = hubContext;
            //            var context = GlobalHost.ConnectionManager.GetHubContext<SignalRHub>();
            //            hubContext = hubContext;
            //            this.hub2 = hub2;
        }

        public async Task ReceiveBatchCommandResult(DatabaseCommandBatchResultDto command)
        {
            await _hubContext.Clients.All.SendAsync("ReceiveBatchCommandResult", command);
            //            await hub2.SendBatch(command);
        }
    }
}
