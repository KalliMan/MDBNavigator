using MDBNavigator.Application.DTOs.Command;
using Microsoft.AspNetCore.SignalR;

namespace MDBNavigator.Infrastructure.SignalR
{
    public class BatchCommandResultHub : Hub
    {
        public async Task SendBatchCommandResult(DatabaseCommandBatchResultDto command, string applicationId)
            => await Clients.Group(applicationId).SendAsync("BatchCommandResult", command);

        public override async Task OnConnectedAsync()
        {
            var applicationId = Context.GetHttpContext()?.Request.Query["applicationId"].ToString();
            if (!string.IsNullOrEmpty(applicationId))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, applicationId);
                await Groups.AddToGroupAsync(Context.ConnectionId, applicationId);
            }
            await base.OnConnectedAsync();
        }
    }
}
