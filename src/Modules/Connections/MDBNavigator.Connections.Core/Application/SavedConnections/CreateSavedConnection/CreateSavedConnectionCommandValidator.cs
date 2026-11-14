using FluentValidation;

namespace MDBNavigator.Connections.Application.SavedConnections.CreateSavedConnection
{
    public class CreateSavedConnectionCommandValidator : AbstractValidator<CreateSavedConnectionCommand>
    {
        public CreateSavedConnectionCommandValidator()
        {
            RuleFor(x => x.UserId).NotEmpty().WithMessage("UserId is required.");
            RuleFor(x => x.Input).SetValidator(new SavedConnectionInputValidator());
        }
    }
}
