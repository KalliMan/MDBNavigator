using MDBNavigator.Accounts.Demo;
using MDBNavigator.API.Core;
using MDBNavigator.API.RateLimiting;
using MDBNavigator.Connections.Application;
using MDBNavigator.Connections.Application.Connect;
using MDBNavigator.Providers.Abstractions;
using MDBNavigator.SharedKernel.Messaging;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MDBNavigator.API.Controllers
{
    // A demo guest's connection to the sample database. The server fills in the settings itself (Demo:Connection), so
    // the password never reaches the browser and a guest can't point the connection elsewhere. The result names the
    // server, user and database, like any connect: the UI shows them. The rest of /api/demo is in Demo/DemoEndpoints.cs;
    // this one is a controller because it needs the browser tab's session, like every other connect.
    public class DemoController : BaseApiController
    {
        [HttpPost("connect")]
        [EnableRateLimiting(RateLimitPolicies.Connect)]
        public async Task<IActionResult> Connect([FromServices] DemoOptions demo,
            [FromServices] ICommandHandler<ConnectCommand, ConnectedResultDto> handler, CancellationToken cancellationToken)
        {
            if (!demo.Enabled)
            {
                return NotFound();
            }
            if (!GuestSessions.IsGuest(User))
            {
                return StatusCode(StatusCodes.Status403Forbidden,
                    new ErrorResponse(StatusCodes.Status403Forbidden, "Only demo sessions can open the demo connection."));
            }

            var settings = new ConnectionSettings
            {
                ServerType = ServerType.PostgreSQL,
                ServerName = demo.Connection.ServerName,
                Port = demo.Connection.Port,
                UserName = demo.Connection.UserName,
                Password = demo.Connection.Password,
                DatabaseName = demo.Connection.DatabaseName
            };
            var result = await handler.Handle(new ConnectCommand(SessionId, settings), cancellationToken);
            // The UI's name for it, rather than "server:port".
            result.ConnectionName = demo.Connection.Name;
            return Ok(result);
        }
    }
}
