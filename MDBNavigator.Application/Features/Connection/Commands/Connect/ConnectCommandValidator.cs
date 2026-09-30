using FluentValidation;

namespace MDBNavigator.Application.Features.Connection.Commands.Connect
{
    public class ConnectCommandValidator : AbstractValidator<ConnectCommand>
    {
        public ConnectCommandValidator()
        {
            RuleFor(x => x.SessionId).NotEmpty().WithMessage("SessionId is required.");
            RuleFor(x => x.ConnectionSettings.ServerType).NotEmpty().WithMessage("ServerType is required.");
            RuleFor(x => x.ConnectionSettings.ServerName).NotEmpty().WithMessage("ServerName is required.");
            RuleFor(x => x.ConnectionSettings.UserName).NotEmpty().WithMessage("UserName is required.");
            RuleFor(x => x.ConnectionSettings.Password).NotEmpty().WithMessage("Password is required.");
            RuleFor(x => x.ConnectionSettings.Port).GreaterThan(0).WithMessage("Port must be a positive integer.");
        }
    }
}
