using MDBNavigator.API.DTOs;
using MDBNavigator.Application.Features.SavedConnections;
using MDBNavigator.Application.Features.SavedConnections.Commands.CreateSavedConnection;
using MDBNavigator.Application.Features.SavedConnections.Commands.DeleteSavedConnection;
using MDBNavigator.Application.Features.SavedConnections.Commands.ForgetSavedPassword;
using MDBNavigator.Application.Features.SavedConnections.Commands.UpdateSavedConnection;
using MDBNavigator.Application.Features.SavedConnections.Queries.GetSavedConnection;
using MDBNavigator.Application.Features.SavedConnections.Queries.GetSavedConnections;
using MDBNavigator.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace MDBNavigator.API.Controllers
{
    // The signed-in user's saved connections (with Auth:Mode None: the local user's). The owner always comes from
    // the session (UserId), never from the request.
    public class SavedConnectionsController : BaseApiController
    {
        private readonly IMediator _mediator;

        public SavedConnectionsController(IMediator mediator) => _mediator = mediator;

        [HttpGet]
        public async Task<IActionResult> List(CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetSavedConnectionsQuery(UserId), cancellationToken));

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> Get([FromRoute] Guid id, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new GetSavedConnectionQuery(UserId, id), cancellationToken));

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] SavedConnectionRequest value, CancellationToken cancellationToken)
        {
            var created = await _mediator.Send(new CreateSavedConnectionCommand(UserId, MapToInput(value)), cancellationToken);
            return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update([FromRoute] Guid id, [FromBody] SavedConnectionRequest value, CancellationToken cancellationToken)
            => Ok(await _mediator.Send(new UpdateSavedConnectionCommand(UserId, id, MapToInput(value)), cancellationToken));

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete([FromRoute] Guid id, CancellationToken cancellationToken)
        {
            await _mediator.Send(new DeleteSavedConnectionCommand(UserId, id), cancellationToken);
            return NoContent();
        }

        // Forgets the remembered password; the saved connection stays. 204, or 404.
        [HttpDelete("{id:guid}/password")]
        public async Task<IActionResult> ForgetPassword([FromRoute] Guid id, CancellationToken cancellationToken)
        {
            await _mediator.Send(new ForgetSavedPasswordCommand(UserId, id), cancellationToken);
            return NoContent();
        }

        // An unknown server type name becomes ServerType.None, which the validator rejects (as in DatabaseConnectionController).
        private static SavedConnectionInput MapToInput(SavedConnectionRequest r) => new(
            r.Name,
            ServerTypes.TryParse(r.ServerType, out var serverType) ? serverType : ServerType.None,
            r.ServerName, r.Port, r.DatabaseName, r.UserName, r.Color, r.RememberPassword, r.Password);
    }
}
