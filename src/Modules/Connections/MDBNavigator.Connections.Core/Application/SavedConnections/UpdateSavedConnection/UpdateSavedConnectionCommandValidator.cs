using FluentValidation;

namespace MDBNavigator.Connections.Application.SavedConnections.UpdateSavedConnection
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
