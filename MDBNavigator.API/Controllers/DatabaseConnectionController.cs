using MDBNavigator.API.DTOs;
using MDBNavigator.Application.Features.Connection.Commands.Connect;
using MDBNavigator.Application.Features.Connection.Commands.Disconnect;
using MDBNavigator.Application.Features.Connection.Commands.Reconnect;
using MDBNavigator.Domain.Enums;
using MDBNavigator.Domain.ValueObjects;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace MDBNavigator.API.Controllers
{
    public class DatabaseConnectionController : BaseApiController
    {
        private readonly IMediator _mediator;

        public DatabaseConnectionController(IMediator mediator) => _mediator = mediator;

        [HttpPost("connect")]
        public async Task<IActionResult> Connect([FromBody] ConnectionSettingsQuery value, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new ConnectCommand(SessionId, MapToSettings(value)), cancellationToken));

        [HttpPost("reconnect/{connectionId}")]
        public async Task<IActionResult> Reconnect([FromRoute] string connectionId, [FromBody] ConnectionSettingsQuery value, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new ReconnectCommand(SessionId, connectionId, MapToSettings(value)), cancellationToken));

        [HttpPost("disconnect/{connectionId}")]
        public async Task<IActionResult> Disconnect([FromRoute] string connectionId, CancellationToken cancellationToken)
        {
            await _mediator.Send(new DisconnectCommand(SessionId, connectionId), cancellationToken);
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
            Password = q.Password
        };
    }
}
