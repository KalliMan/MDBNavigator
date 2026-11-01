using MDBNavigator.Application.DTOs;
using MDBNavigator.Application.Messaging;
using MDBNavigator.Domain.ValueObjects;

namespace MDBNavigator.Application.Features.Connection.Commands.Reconnect
{
    // CaptchaToken: the Captcha-Token header, needed only during the failed-connect wait with a CAPTCHA configured.
    public record ReconnectCommand(string SessionId, string ConnectionId, ConnectionSettings ConnectionSettings, string? CaptchaToken = null)
        : ICommand<ConnectedResultDto>;
}
