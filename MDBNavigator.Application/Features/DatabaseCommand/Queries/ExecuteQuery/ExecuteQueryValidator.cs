using FluentValidation;

namespace MDBNavigator.Application.Features.DatabaseCommand.Queries.ExecuteQuery
{
    public class ExecuteQueryValidator : AbstractValidator<ExecuteQueryQuery>
    {
        public ExecuteQueryValidator()
        {
            RuleFor(x => x.ConnectionId).NotEmpty().WithMessage("ConnectionId is required.");
            RuleFor(x => x.ExecutionId).NotEmpty().WithMessage("ExecutionId is required.");
            RuleFor(x => x.DatabaseName).NotEmpty().WithMessage("DatabaseName is required.");
            RuleFor(x => x.CmdQuery).NotEmpty().WithMessage("CmdQuery is required.");
        }
    }
}
