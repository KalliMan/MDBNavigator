using FluentValidation;
using FluentValidation.Results;
using MDBNavigator.SharedKernel.Messaging;

namespace MDBNavigator.SharedKernel.Behaviors
{
    // Runs every FluentValidation validator of the request before the handler. When there is a failure it throws
    // FluentValidation.ValidationException (the exception middleware answers 400) and the handler is not called.
    internal static class ValidationDecorator
    {
        internal sealed class CommandHandler<TCommand, TResponse> : ICommandHandler<TCommand, TResponse>
            where TCommand : ICommand<TResponse>
        {
            private readonly ICommandHandler<TCommand, TResponse> _inner;
            private readonly IEnumerable<IValidator<TCommand>> _validators;

            public CommandHandler(ICommandHandler<TCommand, TResponse> inner, IEnumerable<IValidator<TCommand>> validators)
            {
                _inner = inner;
                _validators = validators;
            }

            public async Task<TResponse> Handle(TCommand command, CancellationToken cancellationToken)
            {
                await ValidateAsync(command, _validators, cancellationToken);
                return await _inner.Handle(command, cancellationToken);
            }
        }

        internal sealed class CommandBaseHandler<TCommand> : ICommandHandler<TCommand>
            where TCommand : ICommand
        {
            private readonly ICommandHandler<TCommand> _inner;
            private readonly IEnumerable<IValidator<TCommand>> _validators;

            public CommandBaseHandler(ICommandHandler<TCommand> inner, IEnumerable<IValidator<TCommand>> validators)
            {
                _inner = inner;
                _validators = validators;
            }

            public async Task Handle(TCommand command, CancellationToken cancellationToken)
            {
                await ValidateAsync(command, _validators, cancellationToken);
                await _inner.Handle(command, cancellationToken);
            }
        }

        internal sealed class QueryHandler<TQuery, TResponse> : IQueryHandler<TQuery, TResponse>
            where TQuery : IQuery<TResponse>
        {
            private readonly IQueryHandler<TQuery, TResponse> _inner;
            private readonly IEnumerable<IValidator<TQuery>> _validators;

            public QueryHandler(IQueryHandler<TQuery, TResponse> inner, IEnumerable<IValidator<TQuery>> validators)
            {
                _inner = inner;
                _validators = validators;
            }

            public async Task<TResponse> Handle(TQuery query, CancellationToken cancellationToken)
            {
                await ValidateAsync(query, _validators, cancellationToken);
                return await _inner.Handle(query, cancellationToken);
            }
        }

        private static async Task ValidateAsync<TRequest>(
            TRequest request,
            IEnumerable<IValidator<TRequest>> validators,
            CancellationToken cancellationToken)
        {
            var context = new ValidationContext<TRequest>(request);
            var failures = new List<ValidationFailure>();
            foreach (var validator in validators)
            {
                var result = await validator.ValidateAsync(context, cancellationToken);
                failures.AddRange(result.Errors);
            }

            if (failures.Count != 0)
            {
                throw new ValidationException(failures);
            }
        }
    }
}
