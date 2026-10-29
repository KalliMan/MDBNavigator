using MDBNavigator.Application.Common;
using MDBNavigator.Application.Contracts;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace MDBNavigator.Infrastructure.BackgroundQueue
{
    public class BackgroundQueueHostedService : BackgroundService
    {
        private readonly IBackgroundTaskQueue _taskQueue;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly QueryExecutionOptions _options;
        private readonly ILogger<BackgroundQueueHostedService> _logger;

        public BackgroundQueueHostedService(IBackgroundTaskQueue taskQueue, IServiceScopeFactory scopeFactory, QueryExecutionOptions options, ILogger<BackgroundQueueHostedService> logger)
        {
            _taskQueue = taskQueue;
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
                Func<IServiceProvider, CancellationToken, Task> task;
                try
                {
                    task = await _taskQueue.DequeueAsync(stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }

                try
                {
                    // Each task gets its own DI scope (scoped services such as the notifier), disposed afterwards.
                    await using var scope = _scopeFactory.CreateAsyncScope();
                    await task(scope.ServiceProvider, stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "An error occurred during execution of a background task");
                }
            }
        }
    }
}
