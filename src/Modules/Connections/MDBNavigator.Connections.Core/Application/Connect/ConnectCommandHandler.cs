using MDBNavigator.Connections.Application.SavedConnections;
using MDBNavigator.Connections.Contracts;
using MDBNavigator.SharedKernel;
using MDBNavigator.SharedKernel.Errors;
using MDBNavigator.SharedKernel.Messaging;

namespace MDBNavigator.Connections.Application.Connect
{
    public class ConnectCommandHandler : ICommandHandler<ConnectCommand, ConnectedResultDto>
    {
        private readonly ConnectionOpener _opener;
        private readonly RememberedPasswordResolver _remembered;

        public ConnectCommandHandler(ConnectionOpener opener, RememberedPasswordResolver remembered)
        {
            _opener = opener;
            _remembered = remembered;
        }

        public async Task<ConnectedResultDto> Handle(ConnectCommand request, CancellationToken cancellationToken)
        {
            // Before the try, so a 404 or 400 from it isn't wrapped as "Connection failed". No connection is attempted
            // here, so it doesn't count towards the failed-connect wait either.
            var (settings, usedSavedConnectionId) = await _remembered.ResolveAsync(
                SessionKey.UserIdOf(request.SessionId), request.ConnectionSettings, request.SavedConnectionId, cancellationToken);

            try
            {
                var result = await _opener.ConnectAsync(
                    request.SessionId, Guid.NewGuid().ToString(),
                    settings, request.CaptchaToken, cancellationToken);
                result.SavedConnectionId = usedSavedConnectionId;
                return result;
            }
            catch (Exception ex) when (ex is not TooManyRequestsException and not CaptchaRequiredException)
            {
                throw new ConnectionFailedException($"Connection failed: {ConnectionOpener.DescribeConnectionError(ex)}", ex);
            }
        }
    }
}
