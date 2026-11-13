using FluentValidation;
using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.DTOs;
using MDBNavigator.Domain.Exceptions;
using MediatR;

namespace MDBNavigator.Application.Features.SavedConnections.Commands.UpdateSavedConnection
{
    public class UpdateSavedConnectionCommandHandler : IRequestHandler<UpdateSavedConnectionCommand, SavedConnectionDto>
    {
        private readonly ISavedConnectionStore _store;
        private readonly ISavedPasswordProtector _passwords;

        public UpdateSavedConnectionCommandHandler(ISavedConnectionStore store, ISavedPasswordProtector passwords)
        {
            _store = store;
            _passwords = passwords;
        }

        public async Task<SavedConnectionDto> Handle(UpdateSavedConnectionCommand request, CancellationToken cancellationToken)
        {
            // Even with no password in the request: the UI never sends true without the key.
            if (request.Input.RememberPassword && !_passwords.Enabled)
            {
                throw new ValidationException(RememberedPassword.NotEnabledMessage);
            }

            var entity = await _store.FindAsync(request.UserId, request.Id, cancellationToken)
                ?? throw new ObjectNotFoundException("Saved connection not found.");

            // The connection may keep its own name (exceptId), so saving it unchanged is not a conflict.
            if (await _store.NameExistsAsync(request.UserId, SavedConnectionMapping.NormalizeName(request.Input.Name), request.Id, cancellationToken))
            {
                throw new ConflictException($"A saved connection named \"{request.Input.Name.Trim()}\" already exists.");
            }

            // Compared before Apply overwrites the stored values.
            var sameTarget = RememberedPassword.SameTarget(entity, request.Input.ServerType, request.Input.ServerName,
                request.Input.Port, request.Input.UserName);

            SavedConnectionMapping.Apply(request.Input, entity, DateTime.UtcNow);

            if (!request.Input.RememberPassword)
            {
                entity.ProtectedPassword = null;
            }
            else if (!string.IsNullOrEmpty(request.Input.Password))
            {
                entity.ProtectedPassword = _passwords.Protect(request.Input.Password, entity.Id, entity.OwnerId);
            }
            else if (!sameTarget)
            {
                // Kept only for the server and user it was typed for (see RememberedPassword.SameTarget).
                entity.ProtectedPassword = null;
            }
            // else: kept as it is.

            await _store.SaveChangesAsync(cancellationToken);
            return SavedConnectionMapping.ToDto(entity, _passwords);
        }
    }
}
