using MDBNavigator.SharedKernel.Errors;
using MDBNavigator.SharedKernel.Messaging;

namespace MDBNavigator.Connections.Application.SavedConnections.ForgetSavedPassword
{
    public class ForgetSavedPasswordCommandHandler : ICommandHandler<ForgetSavedPasswordCommand>
    {
        private readonly ISavedConnectionStore _store;

        public ForgetSavedPasswordCommandHandler(ISavedConnectionStore store)
        {
            _store = store;
        }

        public async Task Handle(ForgetSavedPasswordCommand request, CancellationToken cancellationToken)
        {
            var entity = await _store.FindAsync(request.UserId, request.Id, cancellationToken)
                ?? throw new ObjectNotFoundException("Saved connection not found.");

            entity.ProtectedPassword = null;
            entity.UpdatedAtUtc = DateTime.UtcNow;
            await _store.SaveChangesAsync(cancellationToken);
        }
    }
}
