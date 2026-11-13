using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.DTOs;
using MDBNavigator.Domain.Exceptions;
using MediatR;

namespace MDBNavigator.Application.Features.SavedConnections.Commands.UpdateSavedConnection
{
    public class UpdateSavedConnectionCommandHandler : IRequestHandler<UpdateSavedConnectionCommand, SavedConnectionDto>
    {
        private readonly ISavedConnectionStore _store;

        public UpdateSavedConnectionCommandHandler(ISavedConnectionStore store)
        {
            _store = store;
        }

        public async Task<SavedConnectionDto> Handle(UpdateSavedConnectionCommand request, CancellationToken cancellationToken)
        {
            var entity = await _store.FindAsync(request.UserId, request.Id, cancellationToken)
                ?? throw new ObjectNotFoundException("Saved connection not found.");

            // The connection may keep its own name (exceptId), so saving it unchanged is not a conflict.
            if (await _store.NameExistsAsync(request.UserId, SavedConnectionMapping.NormalizeName(request.Input.Name), request.Id, cancellationToken))
            {
                throw new ConflictException($"A saved connection named \"{request.Input.Name.Trim()}\" already exists.");
            }

            SavedConnectionMapping.Apply(request.Input, entity, DateTime.UtcNow);
            await _store.SaveChangesAsync(cancellationToken);
            return SavedConnectionMapping.ToDto(entity);
        }
    }
}
