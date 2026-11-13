using MDBNavigator.Application.DTOs;
using MDBNavigator.Application.Messaging;
using MDBNavigator.Domain.ValueObjects;

namespace MDBNavigator.Application.Features.Connection.Commands.Connect
{
    // CaptchaToken: the Captcha-Token header, needed only during the failed-connect wait with a CAPTCHA configured.
    // SavedConnectionId with an empty password: connect with that saved connection's remembered password.
    public record ConnectCommand(string SessionId, ConnectionSettings ConnectionSettings, string? CaptchaToken = null,
        Guid? SavedConnectionId = null)
        : ICommand<ConnectedResultDto>;
}
