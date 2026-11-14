using FluentValidation;
using MDBNavigator.Connections.Application.SavedConnections;
using MDBNavigator.Providers.Abstractions;

namespace MDBNavigator.Connections.Application.Connect
{
    public class ConnectCommandValidator : AbstractValidator<ConnectCommand>
    {
        public ConnectCommandValidator()
        {
            RuleFor(x => x.SessionId).NotEmpty().WithMessage("SessionId is required.");
            RuleFor(x => x.ConnectionSettings.ServerType).NotEqual(ServerType.None).WithMessage("ServerType is missing or not supported.");
            RuleFor(x => x.ConnectionSettings.ServerName).NotEmpty().WithMessage("ServerName is required.");
            RuleFor(x => x.ConnectionSettings.UserName).NotEmpty().WithMessage("UserName is required.");
            // With a saved connection id, an empty password means "the remembered one" (checked by RememberedPassword).
            RuleFor(x => x.ConnectionSettings.Password).NotEmpty().When(x => x.SavedConnectionId is null)
                .WithMessage(RememberedPassword.RequiredMessage);
            RuleFor(x => x.ConnectionSettings.Port).GreaterThan(0).WithMessage("Port must be a positive integer.");
            RuleFor(x => x.ConnectionSettings.DatabaseName).MaximumLength(SavedConnectionLimits.DatabaseNameMaxLength)
                .WithMessage($"DatabaseName must be at most {SavedConnectionLimits.DatabaseNameMaxLength} characters.");
        }
    }
}
