using MDBNavigator.BL.BatchCommandResultHub;
using Microsoft.AspNetCore.SignalR;
using Models.Command;

namespace MDBNavigator.API.SignalRHub
{
    public class BatchCommandResultHubProxy : IBatchCommandResultHubProxy
    {
        private readonly IHubContext<BatchCommandResultHub> _hubContext;

        public BatchCommandResultHubProxy(IHubContext<BatchCommandResultHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public async Task SendBatchCommandResult(DatabaseCommandBatchResultDto command, string applicationId)
        {
            await _hubContext.Clients.Group(applicationId)
                .SendAsync("BatchCommandResult", command);
        }
    }
}
