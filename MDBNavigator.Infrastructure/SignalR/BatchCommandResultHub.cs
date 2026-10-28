using Microsoft.AspNetCore.SignalR;

namespace MDBNavigator.Infrastructure.SignalR
{
    // Server-to-client only: results are pushed through IHubContext in BatchNotifier.
    public class BatchCommandResultHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            var applicationId = Context.GetHttpContext()?.Request.Query["applicationId"].ToString();
            if (!string.IsNullOrEmpty(applicationId))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, applicationId);
            }
            await base.OnConnectedAsync();
        }
    }
}
