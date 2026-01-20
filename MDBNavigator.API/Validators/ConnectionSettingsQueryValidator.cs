using FluentValidation;
using MDBNavigator.API.DTOs;

namespace MDBNavigator.API.Validators
{
    public class ConnectionSettingsQueryValidator : AbstractValidator<ConnectionSettingsQuery>
    {
        public ConnectionSettingsQueryValidator()
        {
            RuleFor(x => x.ServerType)
                .NotEmpty().WithMessage("ServerType is required.");
            RuleFor(x => x.ServerName)
                .NotEmpty().WithMessage("ServerName is required.");
            RuleFor(x => x.UserName)
                .NotEmpty().WithMessage("UserName is required.");
            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Password is required.");

            RuleFor(x => x.Port)
                .GreaterThan(0).WithMessage("Port must be a positive integer.");
        }
    }
}
