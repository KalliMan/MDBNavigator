using FluentValidation;

namespace MDBNavigator.Workbench.Application.Queries.RunQuery
{
    public class RunQueryCommandValidator : AbstractValidator<RunQueryCommand>
    {
        public RunQueryCommandValidator()
        {
            RuleFor(x => x.ConnectionId).NotEmpty().WithMessage("ConnectionId is required.");
            RuleFor(x => x.ExecutionId).NotEmpty().WithMessage("ExecutionId is required.");
            RuleFor(x => x.DatabaseName).NotEmpty().WithMessage("DatabaseName is required.");
            RuleFor(x => x.CmdQuery).NotEmpty().WithMessage("CmdQuery is required.");
            RuleFor(x => x.Plan).IsInEnum().WithMessage("Plan must be None, Estimate or Analyze.");
        }
    }
}
