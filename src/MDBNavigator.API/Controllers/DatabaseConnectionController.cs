using MDBNavigator.API.Captcha;
using MDBNavigator.API.DTOs;
using MDBNavigator.API.RateLimiting;
using MDBNavigator.Connections.Application;
using MDBNavigator.Connections.Application.Connect;
using MDBNavigator.Connections.Application.Disconnect;
using MDBNavigator.Connections.Application.Reconnect;
using MDBNavigator.Providers.Abstractions;
using MDBNavigator.SharedKernel.Messaging;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MDBNavigator.API.Controllers
{
    public class DatabaseConnectionController : BaseApiController
    {
        // The Captcha-Token header is needed only after repeated failed connects, when a CAPTCHA is configured;
        // without it the answer is 428 and the UI shows the CAPTCHA.
        [HttpPost("connect")]
        [EnableRateLimiting(RateLimitPolicies.Connect)]
        public async Task<IActionResult> Connect([FromBody] ConnectionSettingsQuery value,
            [FromHeader(Name = CaptchaEndpoints.TokenHeader)] string? captchaToken,
            [FromServices] ICommandHandler<ConnectCommand, ConnectedResultDto> handler, CancellationToken cancellationToken)
            => Ok(await handler.Handle(new ConnectCommand(SessionId, MapToSettings(value), captchaToken, value.SavedConnectionId), cancellationToken));

        [HttpPost("reconnect/{connectionId}")]
        [EnableRateLimiting(RateLimitPolicies.Connect)]
        public async Task<IActionResult> Reconnect([FromRoute] string connectionId, [FromBody] ConnectionSettingsQuery value,
            [FromHeader(Name = CaptchaEndpoints.TokenHeader)] string? captchaToken,
            [FromServices] ICommandHandler<ReconnectCommand, ConnectedResultDto> handler, CancellationToken cancellationToken)
            => Ok(await handler.Handle(new ReconnectCommand(SessionId, connectionId, MapToSettings(value), captchaToken, value.SavedConnectionId), cancellationToken));

        [HttpPost("disconnect/{connectionId}")]
        public async Task<IActionResult> Disconnect([FromRoute] string connectionId,
            [FromServices] ICommandHandler<DisconnectCommand> handler, CancellationToken cancellationToken)
        {
            await handler.Handle(new DisconnectCommand(SessionId, connectionId), cancellationToken);
            return Ok();
        }

        // The UI sends the server type by name ("PostgreSQL", "MS SQL Server"); an unknown name becomes
        // ServerType.None, which the connect validator rejects.
        private static ConnectionSettings MapToSettings(ConnectionSettingsQuery q) => new()
        {
            ServerType = ServerTypes.TryParse(q.ServerType, out var serverType) ? serverType : ServerType.None,
            ServerName = q.ServerName,
            Port = q.Port,
            UserName = q.UserName,
            DatabaseName = string.IsNullOrWhiteSpace(q.DatabaseName) ? null : q.DatabaseName.Trim(),
            Password = q.Password
        };
    }
}
