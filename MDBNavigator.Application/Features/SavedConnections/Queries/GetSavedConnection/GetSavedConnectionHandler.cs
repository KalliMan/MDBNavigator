using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.DTOs;
using MDBNavigator.Application.Messaging;
using MDBNavigator.Domain.Exceptions;
using MediatR;

namespace MDBNavigator.Application.Features.SavedConnections.Queries.GetSavedConnection
{
    public record GetSavedConnectionQuery(string UserId, Guid Id) : IQuery<SavedConnectionDto>;

    public class GetSavedConnectionHandler : IRequestHandler<GetSavedConnectionQuery, SavedConnectionDto>
    {
        private readonly ISavedConnectionStore _store;

        public GetSavedConnectionHandler(ISavedConnectionStore store)
        {
            _store = store;
        }

        public async Task<SavedConnectionDto> Handle(GetSavedConnectionQuery request, CancellationToken cancellationToken)
        {
            // Not found and "belongs to someone else" look the same, so ids don't reveal that a row exists.
            var connection = await _store.FindAsync(request.UserId, request.Id, cancellationToken)
                ?? throw new ObjectNotFoundException("Saved connection not found.");
            return SavedConnectionMapping.ToDto(connection);
        }
    }
}
