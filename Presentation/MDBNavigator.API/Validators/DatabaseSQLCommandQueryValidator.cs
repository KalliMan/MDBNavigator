using FluentValidation;
using MDBNavigator.API.DTOs;

namespace MDBNavigator.API.Validators
{
    public class DatabaseSQLCommandQueryValidator: AbstractValidator<DatabaseSQLCommandQuery>
    {
        public DatabaseSQLCommandQueryValidator()
        {
            RuleFor(x => x.ConnectionId)
                .NotEmpty()
                .WithMessage("ConnectionId is required.");
            RuleFor(x => x.Id)
                .NotEmpty()
                .WithMessage("Id is required.");
            RuleFor(x => x.DatabaseName)
                .NotEmpty()
                .WithMessage("DatabaseName is required.");
            RuleFor(x => x.CmdQuery)
                .NotEmpty()
                .WithMessage("CmdQuery is required.");
        }
    }
}
