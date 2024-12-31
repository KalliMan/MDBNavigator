using MDBNavigator.BL.SignalR;
using Microsoft.AspNetCore.SignalR;
using Models;

namespace MDBNavigator.API.SignalR
{
    public class BatchCommandResultHub: Hub
    {
        public async Task SendBatch(DatabaseCommandBatchResultDto command)
        {
            //await Clients.Client(Context.ConnectionId).ReceiveBatchCommandResult(command);
            await Clients.Client(Context.ConnectionId).SendAsync("ReceiveBatchCommandResult", command);
        }

//        public async override Task OnConnectedAsync()
//        {
//            var httpContext = Context.GetHttpContext();
//            if (httpContext == null)
//            {
//                return;
//            }

//            var commandId = httpContext.Request.Query["commandId"];

////            await base.OnConnectedAsync();
//            //await Clients.Client(Context.ConnectionId).SendAsync("ReceiveBatchCommandResult", "DGD");
//        }
    }
}
