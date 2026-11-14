using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace MDBNavigator.API.Tests.Infrastructure
{
    // Small helpers the tests share, so each fact reads as what it sends and what it expects.
    public static class JsonAssert
    {
        // Plain Assert.Equal on two status codes says nothing about why; the body usually does.
        public static async Task<HttpResponseMessage> ShouldBeAsync(this Task<HttpResponseMessage> request, HttpStatusCode expected)
        {
            var response = await request;
            if (response.StatusCode != expected)
            {
                var body = await response.Content.ReadAsStringAsync();
                Assert.Fail($"Expected {(int)expected} {expected} but got {(int)response.StatusCode} {response.StatusCode}. Body: {body}");
            }

            return response;
        }

        public static async Task<JsonElement> JsonAsync(this HttpResponseMessage response)
            => await response.Content.ReadFromJsonAsync<JsonElement>();

        // The "message" of an error body: { statusCode, message, details? }.
        public static async Task<string> ErrorMessageAsync(this HttpResponseMessage response)
            => (await response.JsonAsync()).GetProperty("message").GetString() ?? "";

        public static string[] Strings(this JsonElement array, string property)
            => array.EnumerateArray().Select(item => item.GetProperty(property).GetString()!).ToArray();
    }
}
