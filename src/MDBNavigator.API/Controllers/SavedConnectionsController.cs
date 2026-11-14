using MDBNavigator.API.DTOs;
using MDBNavigator.Connections.Application.SavedConnections;
using MDBNavigator.Connections.Application.SavedConnections.CreateSavedConnection;
using MDBNavigator.Connections.Application.SavedConnections.DeleteSavedConnection;
using MDBNavigator.Connections.Application.SavedConnections.ForgetSavedPassword;
using MDBNavigator.Connections.Application.SavedConnections.GetSavedConnection;
using MDBNavigator.Connections.Application.SavedConnections.GetSavedConnections;
using MDBNavigator.Connections.Application.SavedConnections.UpdateSavedConnection;
using MDBNavigator.Providers.Abstractions;
using MDBNavigator.SharedKernel.Messaging;
using Microsoft.AspNetCore.Mvc;

namespace MDBNavigator.API.Controllers
{
    // The signed-in user's saved connections (with Auth:Mode None: the local user's). The owner always comes from
    // the session (UserId), never from the request.
    public class SavedConnectionsController : BaseApiController
    {
        [HttpGet]
        public async Task<IActionResult> List(
            [FromServices] IQueryHandler<GetSavedConnectionsQuery, IReadOnlyList<SavedConnectionDto>> handler, CancellationToken cancellationToken)
            => Ok(await handler.Handle(new GetSavedConnectionsQuery(UserId), cancellationToken));

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> Get([FromRoute] Guid id,
            [FromServices] IQueryHandler<GetSavedConnectionQuery, SavedConnectionDto> handler, CancellationToken cancellationToken)
            => Ok(await handler.Handle(new GetSavedConnectionQuery(UserId, id), cancellationToken));

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] SavedConnectionRequest value,
            [FromServices] ICommandHandler<CreateSavedConnectionCommand, SavedConnectionDto> handler, CancellationToken cancellationToken)
        {
            var created = await handler.Handle(new CreateSavedConnectionCommand(UserId, MapToInput(value)), cancellationToken);
            return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update([FromRoute] Guid id, [FromBody] SavedConnectionRequest value,
            [FromServices] ICommandHandler<UpdateSavedConnectionCommand, SavedConnectionDto> handler, CancellationToken cancellationToken)
            => Ok(await handler.Handle(new UpdateSavedConnectionCommand(UserId, id, MapToInput(value)), cancellationToken));

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete([FromRoute] Guid id,
            [FromServices] ICommandHandler<DeleteSavedConnectionCommand> handler, CancellationToken cancellationToken)
        {
            await handler.Handle(new DeleteSavedConnectionCommand(UserId, id), cancellationToken);
            return NoContent();
        }

        // Forgets the remembered password; the saved connection stays. 204, or 404.
        [HttpDelete("{id:guid}/password")]
        public async Task<IActionResult> ForgetPassword([FromRoute] Guid id,
            [FromServices] ICommandHandler<ForgetSavedPasswordCommand> handler, CancellationToken cancellationToken)
        {
            await handler.Handle(new ForgetSavedPasswordCommand(UserId, id), cancellationToken);
            return NoContent();
        }

        // An unknown server type name becomes ServerType.None, which the validator rejects (as in DatabaseConnectionController).
        private static SavedConnectionInput MapToInput(SavedConnectionRequest r) => new(
            r.Name,
            ServerTypes.TryParse(r.ServerType, out var serverType) ? serverType : ServerType.None,
            r.ServerName, r.Port, r.DatabaseName, r.UserName, r.Color, r.RememberPassword, r.Password);
    }
}
