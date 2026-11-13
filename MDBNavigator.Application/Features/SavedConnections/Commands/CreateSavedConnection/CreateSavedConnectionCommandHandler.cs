using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.DTOs;
using MDBNavigator.Domain.Entities;
using MDBNavigator.Domain.Exceptions;
using MediatR;

namespace MDBNavigator.Application.Features.SavedConnections.Commands.CreateSavedConnection
{
    public class CreateSavedConnectionCommandHandler : IRequestHandler<CreateSavedConnectionCommand, SavedConnectionDto>
    {
        private readonly ISavedConnectionStore _store;

        public CreateSavedConnectionCommandHandler(ISavedConnectionStore store)
        {
            _store = store;
        }

        public async Task<SavedConnectionDto> Handle(CreateSavedConnectionCommand request, CancellationToken cancellationToken)
        {
            if (await _store.CountAsync(request.UserId, cancellationToken) >= SavedConnectionLimits.MaxPerUser)
            {
                throw new ConflictException($"You can save up to {SavedConnectionLimits.MaxPerUser} connections. Delete one first.");
            }

            // Checked here for a clear 409; the unique index on (owner, normalized name) is the backstop.
            if (await _store.NameExistsAsync(request.UserId, SavedConnectionMapping.NormalizeName(request.Input.Name), null, cancellationToken))
            {
                throw new ConflictException($"A saved connection named \"{request.Input.Name.Trim()}\" already exists.");
            }

            var now = DateTime.UtcNow;
            var entity = new SavedConnection { OwnerId = request.UserId, CreatedAtUtc = now };
            SavedConnectionMapping.Apply(request.Input, entity, now);

            await _store.AddAsync(entity, cancellationToken);
            return SavedConnectionMapping.ToDto(entity);
        }
    }
}
