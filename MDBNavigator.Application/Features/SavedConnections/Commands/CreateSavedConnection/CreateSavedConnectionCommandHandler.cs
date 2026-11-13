using FluentValidation;
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
        private readonly ISavedPasswordProtector _passwords;

        public CreateSavedConnectionCommandHandler(ISavedConnectionStore store, ISavedPasswordProtector passwords)
        {
            _store = store;
            _passwords = passwords;
        }

        public async Task<SavedConnectionDto> Handle(CreateSavedConnectionCommand request, CancellationToken cancellationToken)
        {
            // Checked first, so a refused request doesn't depend on the list. The UI hides the option without the key,
            // but the server doesn't rely on that.
            if (request.Input.RememberPassword && !_passwords.Enabled)
            {
                throw new ValidationException(RememberedPassword.NotEnabledMessage);
            }
            if (request.Input.RememberPassword && string.IsNullOrEmpty(request.Input.Password))
            {
                throw new ValidationException(RememberedPassword.RequiredMessage);
            }

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

            // entity.Id is set by the entity itself (Guid.CreateVersion7()), so it can be bound into the value before the
            // row exists. With RememberPassword false, a Password in the request is ignored and never stored.
            if (request.Input.RememberPassword)
            {
                entity.ProtectedPassword = _passwords.Protect(request.Input.Password!, entity.Id, entity.OwnerId);
            }

            await _store.AddAsync(entity, cancellationToken);
            return SavedConnectionMapping.ToDto(entity, _passwords);
        }
    }
}
