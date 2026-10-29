using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.DTOs.Command;
using Microsoft.AspNetCore.SignalR;

namespace MDBNavigator.Infrastructure.SignalR
{
    public class BatchNotifier : IBatchNotifier
    {
        private readonly IHubContext<BatchCommandResultHub> _hubContext;

        public BatchNotifier(IHubContext<BatchCommandResultHub> hubContext)
        {
            _hubContext = hubContext;
        }

        // Each session has its own hub group (see BatchCommandResultHub).
        public async Task SendBatchCommandResult(DatabaseCommandBatchResultDto command, string sessionId)
            => await _hubContext.Clients.Group(sessionId).SendAsync("BatchCommandResult", command);

        public async Task SendCommandFinished(CommandFinishedDto result, string sessionId)
            => await _hubContext.Clients.Group(sessionId).SendAsync("CommandFinished", result);
    }
}
