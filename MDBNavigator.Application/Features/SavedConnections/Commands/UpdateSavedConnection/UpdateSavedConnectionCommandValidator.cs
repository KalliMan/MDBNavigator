using FluentValidation;

namespace MDBNavigator.Application.Features.SavedConnections.Commands.UpdateSavedConnection
{
    public class UpdateSavedConnectionCommandValidator : AbstractValidator<UpdateSavedConnectionCommand>
    {
        public UpdateSavedConnectionCommandValidator()
        {
            RuleFor(x => x.UserId).NotEmpty().WithMessage("UserId is required.");
            RuleFor(x => x.Input).SetValidator(new SavedConnectionInputValidator());
        }
    }
}
