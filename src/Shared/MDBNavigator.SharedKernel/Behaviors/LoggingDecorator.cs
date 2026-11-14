using MDBNavigator.SharedKernel.Messaging;
using Microsoft.Extensions.Logging;
using System.Diagnostics;

namespace MDBNavigator.SharedKernel.Behaviors
{
    // Logs the request type and its duration. Never the request itself: it can hold a database password.
    // Nothing is logged when the handler throws; the exception passes through to the exception middleware.
    internal static partial class LoggingDecorator
    {
        internal sealed class CommandHandler<TCommand, TResponse> : ICommandHandler<TCommand, TResponse>
            where TCommand : ICommand<TResponse>
        {
            private readonly ICommandHandler<TCommand, TResponse> _inner;
            private readonly ILogger<CommandHandler<TCommand, TResponse>> _logger;

            public CommandHandler(ICommandHandler<TCommand, TResponse> inner, ILogger<CommandHandler<TCommand, TResponse>> logger)
            {
                _inner = inner;
                _logger = logger;
            }

            public async Task<TResponse> Handle(TCommand command, CancellationToken cancellationToken)
            {
                var start = Stopwatch.GetTimestamp();
                var response = await _inner.Handle(command, cancellationToken);
                LogHandled(_logger, typeof(TCommand).Name, ElapsedMs(start));
                return response;
            }
        }

        internal sealed class CommandBaseHandler<TCommand> : ICommandHandler<TCommand>
            where TCommand : ICommand
        {
            private readonly ICommandHandler<TCommand> _inner;
            private readonly ILogger<CommandBaseHandler<TCommand>> _logger;

            public CommandBaseHandler(ICommandHandler<TCommand> inner, ILogger<CommandBaseHandler<TCommand>> logger)
            {
                _inner = inner;
                _logger = logger;
            }

            public async Task Handle(TCommand command, CancellationToken cancellationToken)
            {
                var start = Stopwatch.GetTimestamp();
                await _inner.Handle(command, cancellationToken);
                LogHandled(_logger, typeof(TCommand).Name, ElapsedMs(start));
            }
        }

        internal sealed class QueryHandler<TQuery, TResponse> : IQueryHandler<TQuery, TResponse>
            where TQuery : IQuery<TResponse>
        {
            private readonly IQueryHandler<TQuery, TResponse> _inner;
            private readonly ILogger<QueryHandler<TQuery, TResponse>> _logger;

            public QueryHandler(IQueryHandler<TQuery, TResponse> inner, ILogger<QueryHandler<TQuery, TResponse>> logger)
            {
                _inner = inner;
                _logger = logger;
            }

            public async Task<TResponse> Handle(TQuery query, CancellationToken cancellationToken)
            {
                var start = Stopwatch.GetTimestamp();
                var response = await _inner.Handle(query, cancellationToken);
                LogHandled(_logger, typeof(TQuery).Name, ElapsedMs(start));
                return response;
            }
        }

        private static long ElapsedMs(long start) => (long)Stopwatch.GetElapsedTime(start).TotalMilliseconds;

        [LoggerMessage(Level = LogLevel.Information, Message = "{RequestName} handled in {ElapsedMs} ms")]
        private static partial void LogHandled(ILogger logger, string requestName, long elapsedMs);
    }
}
