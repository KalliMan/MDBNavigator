using MDBNavigator.Application.Contracts;
using MDBNavigator.Domain.Exceptions;
using MediatR;

namespace MDBNavigator.Application.Features.SavedConnections.Commands.DeleteSavedConnection
{
    public class DeleteSavedConnectionCommandHandler : IRequestHandler<DeleteSavedConnectionCommand, Unit>
    {
        private readonly ISavedConnectionStore _store;

        public DeleteSavedConnectionCommandHandler(ISavedConnectionStore store)
        {
            _store = store;
        }

        public async Task<Unit> Handle(DeleteSavedConnectionCommand request, CancellationToken cancellationToken)
        {
            if (!await _store.DeleteAsync(request.UserId, request.Id, cancellationToken))
            {
                throw new ObjectNotFoundException("Saved connection not found.");
            }
            return Unit.Value;
        }
    }
}
