using MDBNavigator.SharedKernel.Errors;
using MDBNavigator.SharedKernel.Messaging;

namespace MDBNavigator.Connections.Application.SavedConnections.DeleteSavedConnection
{
    public class DeleteSavedConnectionCommandHandler : ICommandHandler<DeleteSavedConnectionCommand>
    {
        private readonly ISavedConnectionStore _store;

        public DeleteSavedConnectionCommandHandler(ISavedConnectionStore store)
        {
            _store = store;
        }

        public async Task Handle(DeleteSavedConnectionCommand request, CancellationToken cancellationToken)
        {
            if (!await _store.DeleteAsync(request.UserId, request.Id, cancellationToken))
            {
                throw new ObjectNotFoundException("Saved connection not found.");
            }
        }
    }
}
