using MDBNavigator.Workbench.Application.Queries;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace MDBNavigator.Workbench.Infrastructure.QueryRuns
{
    public class QueryRunHostedService : BackgroundService
    {
        private readonly IQueryRunQueue _queue;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly QueryExecutionOptions _options;
        private readonly ILogger<QueryRunHostedService> _logger;

        public QueryRunHostedService(IQueryRunQueue queue, IServiceScopeFactory scopeFactory, QueryExecutionOptions options, ILogger<QueryRunHostedService> logger)
        {
            _queue = queue;
            _scopeFactory = scopeFactory;
            _options = options;
            _logger = logger;
        }

        // Several workers, so one long query does not block the queries of other tabs/users.
        protected override Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var workerCount = Math.Max(1, _options.MaxConcurrentQueries);
            return Task.WhenAll(Enumerable.Range(0, workerCount).Select(_ => RunWorkerAsync(stoppingToken)));
        }

        private async Task RunWorkerAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                QueuedQueryRun run;
                try
                {
                    run = await _queue.DequeueAsync(stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }

                try
                {
                    // Each run gets its own DI scope (scoped services such as the notifier), disposed afterwards.
                    await using var scope = _scopeFactory.CreateAsyncScope();
                    await scope.ServiceProvider.GetRequiredService<QueryExecution>()
                        .RunAsync(run.Command, run.Cancellation, stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "A query run failed outside its own error handling");
                }
            }
        }
    }
}
