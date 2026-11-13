using MDBNavigator.Application.Contracts;
using MDBNavigator.Application.DTOs;
using MDBNavigator.Application.Messaging;
using MediatR;

namespace MDBNavigator.Application.Features.SavedConnections.Queries.GetSavedConnections
{
    public record GetSavedConnectionsQuery(string UserId) : IQuery<IReadOnlyList<SavedConnectionDto>>;

    public class GetSavedConnectionsHandler : IRequestHandler<GetSavedConnectionsQuery, IReadOnlyList<SavedConnectionDto>>
    {
        private readonly ISavedConnectionStore _store;
        private readonly ISavedPasswordProtector _passwords;

        public GetSavedConnectionsHandler(ISavedConnectionStore store, ISavedPasswordProtector passwords)
        {
            _store = store;
            _passwords = passwords;
        }

        public async Task<IReadOnlyList<SavedConnectionDto>> Handle(GetSavedConnectionsQuery request, CancellationToken cancellationToken)
        {
            var connections = await _store.ListAsync(request.UserId, cancellationToken);
            return connections.Select(c => SavedConnectionMapping.ToDto(c, _passwords)).ToList();
        }
    }
}
