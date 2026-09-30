using Microsoft.AspNetCore.SignalR;
using Models.Command;

namespace MDBNavigator.API.SignalRHub
{
    public class BatchCommandResultHub: Hub
    {
        public async Task SendBatchCommandResult(DatabaseCommandBatchResultDto command, string applicationId)
        {
            await Clients.Group(applicationId).SendAsync("BatchCommandResult", command);
        }

        public override async Task OnConnectedAsync()
        {
            var httpContext = Context.GetHttpContext();
            if (httpContext == null)
            {
                return;
            }

            var applicationId = httpContext.Request.Query["applicationId"];
            if (!string.IsNullOrEmpty(applicationId))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, applicationId!);
                await Groups.AddToGroupAsync(Context.ConnectionId, applicationId!);
            }

            await base.OnConnectedAsync();
        }


    }
}
