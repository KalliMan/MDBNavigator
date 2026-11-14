using MDBNavigator.SharedKernel.Errors;
using MDBNavigator.SharedKernel.Messaging;

namespace MDBNavigator.Connections.Application.SavedConnections.GetSavedConnection
{
    public record GetSavedConnectionQuery(string UserId, Guid Id) : IQuery<SavedConnectionDto>;

    public class GetSavedConnectionHandler : IQueryHandler<GetSavedConnectionQuery, SavedConnectionDto>
    {
        private readonly ISavedConnectionStore _store;
        private readonly ISavedPasswordProtector _passwords;

        public GetSavedConnectionHandler(ISavedConnectionStore store, ISavedPasswordProtector passwords)
        {
            _store = store;
            _passwords = passwords;
        }

        public async Task<SavedConnectionDto> Handle(GetSavedConnectionQuery request, CancellationToken cancellationToken)
        {
            // Not found and "belongs to someone else" look the same, so ids don't reveal that a row exists.
            var connection = await _store.FindAsync(request.UserId, request.Id, cancellationToken)
                ?? throw new ObjectNotFoundException("Saved connection not found.");
            return SavedConnectionMapping.ToDto(connection, _passwords);
        }
    }
}
