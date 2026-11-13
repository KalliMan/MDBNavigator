using MDBNavigator.Application.DTOs;
using MDBNavigator.Application.Messaging;
using MDBNavigator.Domain.ValueObjects;

namespace MDBNavigator.Application.Features.Connection.Commands.Reconnect
{
    // CaptchaToken: the Captcha-Token header, needed only during the failed-connect wait with a CAPTCHA configured.
    // SavedConnectionId with an empty password: connect with that saved connection's remembered password.
    public record ReconnectCommand(string SessionId, string ConnectionId, ConnectionSettings ConnectionSettings, string? CaptchaToken = null,
        Guid? SavedConnectionId = null)
        : ICommand<ConnectedResultDto>;
}
