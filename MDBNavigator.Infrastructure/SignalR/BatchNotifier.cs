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

        public async Task SendBatchCommandResult(DatabaseCommandBatchResultDto command, string applicationId)
            => await _hubContext.Clients.Group(applicationId).SendAsync("BatchCommandResult", command);

        public async Task SendCommandFinished(CommandFinishedDto result, string applicationId)
            => await _hubContext.Clients.Group(applicationId).SendAsync("CommandFinished", result);
    }
}
