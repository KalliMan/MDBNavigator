using MDBNavigator.Application.Contracts;
using MDBNavigator.Domain.Exceptions;
using MediatR;

namespace MDBNavigator.Application.Features.SavedConnections.Commands.ForgetSavedPassword
{
    public class ForgetSavedPasswordCommandHandler : IRequestHandler<ForgetSavedPasswordCommand, Unit>
    {
        private readonly ISavedConnectionStore _store;

        public ForgetSavedPasswordCommandHandler(ISavedConnectionStore store)
        {
            _store = store;
        }

        public async Task<Unit> Handle(ForgetSavedPasswordCommand request, CancellationToken cancellationToken)
        {
            var entity = await _store.FindAsync(request.UserId, request.Id, cancellationToken)
                ?? throw new ObjectNotFoundException("Saved connection not found.");

            entity.ProtectedPassword = null;
            entity.UpdatedAtUtc = DateTime.UtcNow;
            await _store.SaveChangesAsync(cancellationToken);
            return Unit.Value;
        }
    }
}
