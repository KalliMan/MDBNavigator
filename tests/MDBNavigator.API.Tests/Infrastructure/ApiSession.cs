using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace MDBNavigator.API.Tests.Infrastructure
{
    public sealed record QueryRun(string ExecutionId, IReadOnlyList<JsonElement> Statements, IReadOnlyList<JsonElement> Batches, JsonElement Finished);

    // One signed-in browser tab. The session cookie is kept here and sent by hand, because outside Development it is
    // Secure and the test server's cookie handling would not send it, and the SignalR client needs it too.
    public sealed class ApiSession : IDisposable
    {
        private static readonly TimeSpan FinishTimeout = TimeSpan.FromSeconds(30);

        private readonly AppFixture _fixture;

        public HttpClient Client { get; }
        public string TabId { get; }
        public string Cookie { get; }

        public ApiSession(AppFixture fixture, string cookie, string tabId)
        {
            _fixture = fixture;
            Cookie = cookie;
            TabId = tabId;
            Client = fixture.CreateAnonymousClient();
            Client.DefaultRequestHeaders.Add("Cookie", cookie);
            Client.DefaultRequestHeaders.Add("id", tabId);
        }

        // The same account in another browser tab.
        public ApiSession WithNewTab() => new(_fixture, Cookie, Guid.NewGuid().ToString());

        public async Task<string> ConnectAsync()
        {
            var response = await Client.PostAsJsonAsync("/api/databaseConnection/connect", _fixture.ConnectBody());
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var body = await response.Content.ReadFromJsonAsync<JsonElement>();
            var connectionId = body.GetProperty("connectionId").GetString();
            Assert.False(string.IsNullOrEmpty(connectionId));
            return connectionId;
        }

        public Task<HubListener> ListenAsync() => HubListener.StartAsync(_fixture.Factory, TabId, Cookie);

        // Starts an execution without waiting for it; the response is the 202 (or whatever the API answered).
        public Task<HttpResponseMessage> PostExecuteAsync(string connectionId, string sql, string executionId)
            => Client.PostAsJsonAsync("/api/databaseCommand", new
            {
                connectionId,
                databaseName = AppFixture.Database,
                cmdQuery = sql,
                executionId
            });

        public async Task<QueryRun> RunAsync(string connectionId, string sql, HubListener hub)
        {
            var executionId = Guid.NewGuid().ToString();
            var response = await PostExecuteAsync(connectionId, sql, executionId);
            Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);

            var finished = await hub.WaitForFinishedAsync(executionId, FinishTimeout);
            return new QueryRun(executionId, hub.Statements(executionId), hub.Batches(executionId), finished);
        }

        public void Dispose() => Client.Dispose();
    }
}
