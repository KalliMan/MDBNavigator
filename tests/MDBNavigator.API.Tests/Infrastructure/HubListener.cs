using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.SignalR.Client;
using System.Collections.Concurrent;
using System.Text.Json;

namespace MDBNavigator.API.Tests.Infrastructure
{
    // A connected SignalR hub for one tab. It files every message under its execution id, so a test can ask for the
    // messages of the run it started.
    public sealed class HubListener : IAsyncDisposable
    {
        private readonly HubConnection _connection;
        private readonly ConcurrentDictionary<string, ExecutionMessages> _executions = new();

        private HubListener(HubConnection connection)
        {
            _connection = connection;
            _connection.On<JsonElement>("StatementStarted", message =>
            {
                var execution = MessagesOf(message);
                execution.Statements.Enqueue(message);
                execution.FirstStatementStarted.TrySetResult(message);
            });
            _connection.On<JsonElement>("BatchCommandResult", message => MessagesOf(message).Batches.Enqueue(message));
            _connection.On<JsonElement>("CommandFinished", message => MessagesOf(message).Finished.TrySetResult(message));
        }

        // Long polling through the test server's own handler: WebSockets would need a real port.
        public static async Task<HubListener> StartAsync(ApiFactory factory, string tabId, string cookie)
        {
            var connection = new HubConnectionBuilder()
                .WithUrl($"https://localhost/batchCommandResult?tabId={tabId}", options =>
                {
                    options.HttpMessageHandlerFactory = _ => factory.Server.CreateHandler();
                    options.Transports = HttpTransportType.LongPolling;
                    options.Headers.Add("Cookie", cookie);
                })
                .Build();

            var listener = new HubListener(connection);
            await connection.StartAsync();
            return listener;
        }

        public Task<JsonElement> WaitForStatementStartedAsync(string executionId, TimeSpan timeout)
            => WaitAsync(MessagesOf(executionId).FirstStatementStarted, executionId, "StatementStarted", timeout);

        public Task<JsonElement> WaitForFinishedAsync(string executionId, TimeSpan timeout)
            => WaitAsync(MessagesOf(executionId).Finished, executionId, "CommandFinished", timeout);

        public IReadOnlyList<JsonElement> Statements(string executionId) => MessagesOf(executionId).Statements.ToArray();

        public IReadOnlyList<JsonElement> Batches(string executionId) => MessagesOf(executionId).Batches.ToArray();

        public async ValueTask DisposeAsync() => await _connection.DisposeAsync();

        private ExecutionMessages MessagesOf(string executionId) => _executions.GetOrAdd(executionId, _ => new ExecutionMessages());

        private ExecutionMessages MessagesOf(JsonElement message) => MessagesOf(message.GetProperty("executionId").GetString()!);

        private static async Task<JsonElement> WaitAsync(TaskCompletionSource<JsonElement> source, string executionId, string eventName, TimeSpan timeout)
        {
            var done = await Task.WhenAny(source.Task, Task.Delay(timeout));
            if (done != source.Task)
            {
                throw new TimeoutException($"No {eventName} message for execution {executionId} within {timeout.TotalSeconds:0} seconds.");
            }

            return await source.Task;
        }

        // Messages arrive on another thread, so everything here is thread-safe, and the completion sources run their
        // continuations elsewhere to keep the hub's receive loop free.
        private sealed class ExecutionMessages
        {
            public ConcurrentQueue<JsonElement> Statements { get; } = new();
            public ConcurrentQueue<JsonElement> Batches { get; } = new();
            public TaskCompletionSource<JsonElement> FirstStatementStarted { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
            public TaskCompletionSource<JsonElement> Finished { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
        }
    }
}
