using FluentValidation;
using MDBNavigator.Providers.Abstractions;
using System.Text.RegularExpressions;

namespace MDBNavigator.Connections.Application.SavedConnections
{
    // Lengths are checked on the trimmed value: the handlers store trimmed values, so this is what ends up in the column.
    public class SavedConnectionInputValidator : AbstractValidator<SavedConnectionInput>
    {
        private static readonly Regex HexColor = new("^#[0-9a-fA-F]{6}$", RegexOptions.CultureInvariant);

        public SavedConnectionInputValidator()
        {
            RuleFor(x => x.Name).Must(n => !string.IsNullOrWhiteSpace(n)).WithMessage("Name is required.");
            RuleFor(x => x.Name).Must(n => n.Trim().Length <= SavedConnectionLimits.NameMaxLength)
                .When(x => !string.IsNullOrWhiteSpace(x.Name))
                .WithMessage($"Name must be at most {SavedConnectionLimits.NameMaxLength} characters.");

            RuleFor(x => x.ServerType).NotEqual(ServerType.None).WithMessage("ServerType is missing or not supported.");

            RuleFor(x => x.ServerName).Must(n => !string.IsNullOrWhiteSpace(n)).WithMessage("ServerName is required.");
            RuleFor(x => x.ServerName).Must(n => n.Trim().Length <= SavedConnectionLimits.ServerNameMaxLength)
                .When(x => !string.IsNullOrWhiteSpace(x.ServerName))
                .WithMessage($"ServerName must be at most {SavedConnectionLimits.ServerNameMaxLength} characters.");

            RuleFor(x => x.Port).InclusiveBetween(1, 65535).WithMessage("Port must be between 1 and 65535.");

            RuleFor(x => x.DatabaseName).Must(n => n!.Trim().Length <= SavedConnectionLimits.DatabaseNameMaxLength)
                .When(x => !string.IsNullOrWhiteSpace(x.DatabaseName))
                .WithMessage($"DatabaseName must be at most {SavedConnectionLimits.DatabaseNameMaxLength} characters.");

            RuleFor(x => x.UserName).Must(n => !string.IsNullOrWhiteSpace(n)).WithMessage("UserName is required.");
            RuleFor(x => x.UserName).Must(n => n.Trim().Length <= SavedConnectionLimits.UserNameMaxLength)
                .When(x => !string.IsNullOrWhiteSpace(x.UserName))
                .WithMessage($"UserName must be at most {SavedConnectionLimits.UserNameMaxLength} characters.");

            RuleFor(x => x.Color).Must(c => HexColor.IsMatch(c!))
                .When(x => !string.IsNullOrEmpty(x.Color))
                .WithMessage("Color must be a hex color like #16a34a.");

            // Not trimmed: passwords are used exactly as typed.
            RuleFor(x => x.Password).Must(p => p!.Length <= SavedConnectionLimits.PasswordMaxLength)
                .When(x => !string.IsNullOrEmpty(x.Password))
                .WithMessage($"Password must be at most {SavedConnectionLimits.PasswordMaxLength} characters.");
        }
    }
}
