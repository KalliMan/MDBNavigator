using MDBNavigator.Application.Common;
using Microsoft.AspNetCore.SignalR;

namespace MDBNavigator.Infrastructure.SignalR
{
    // Server-to-client only: results are pushed through IHubContext in BatchNotifier.
    public class BatchCommandResultHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            var tabId = Context.GetHttpContext()?.Request.Query["applicationId"].ToString();
            if (!string.IsNullOrEmpty(tabId))
            {
                // The group is the session, so a connection only receives its own user's results. With accounts the
                // hub requires sign-in, so UserIdentifier is set; Auth:Mode = None has only the local user.
                var userId = Context.UserIdentifier ?? SessionKey.LocalUserId;
                await Groups.AddToGroupAsync(Context.ConnectionId, SessionKey.Create(userId, tabId));
            }
            await base.OnConnectedAsync();
        }
    }
}
