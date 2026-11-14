using MDBNavigator.API.Tests.Infrastructure;
using System.Net;
using System.Text.Json;

namespace MDBNavigator.API.Tests
{
    // The sample objects come from AppFixture's SampleSchema.
    [Collection(ApiCollection.Name)]
    public class SchemaTests
    {
        private readonly AppFixture _fixture;

        public SchemaTests(AppFixture fixture) => _fixture = fixture;

        // A fresh user and connection per fact; returns the successful response of the GET.
        private async Task<HttpResponseMessage> GetAsync(Func<string, string> route)
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            using var signedIn = session;
            var connectionId = await session.ConnectAsync();
            return await session.Client.GetAsync(route(connectionId)).ShouldBeAsync(HttpStatusCode.OK);
        }

        [Fact]
        public async Task Databases_lists_the_database()
        {
            var response = await GetAsync(id => $"/api/databaseSchema/databases/{id}");

            var databases = (await response.JsonAsync()).GetProperty("databases");
            Assert.Contains("postgres", databases.Strings("name"));
        }

        [Fact]
        public async Task Tables_lists_the_sample_table()
        {
            var response = await GetAsync(id => $"/api/databaseSchema/tables/{id}?database=postgres");

            var tables = (await response.JsonAsync()).GetProperty("tables");
            Assert.Contains(tables.EnumerateArray(), table =>
                table.GetProperty("databaseSchema").GetString() == "public" && table.GetProperty("name").GetString() == "smoke_items");
        }

        [Fact]
        public async Task Table_definition_has_columns_and_indexes()
        {
            var response = await GetAsync(id =>
                $"/api/databaseSchema/tableDefinition/{id}?database=postgres&schema=public&table=smoke_items");

            var definition = await response.JsonAsync();
            var columns = definition.GetProperty("columns");
            Assert.Equal(["id", "name", "note"], columns.Strings("columnName"));
            Assert.False(Column(columns, "name").GetProperty("isNullable").GetBoolean());
            Assert.True(Column(columns, "note").GetProperty("isNullable").GetBoolean());
            Assert.NotEmpty(definition.GetProperty("indexes").EnumerateArray());
        }

        [Fact]
        public async Task Views_lists_the_sample_view()
        {
            var response = await GetAsync(id => $"/api/databaseSchema/views/{id}?database=postgres");

            Assert.Contains("smoke_items_view", await response.Content.ReadAsStringAsync());
        }

        [Fact]
        public async Task Functions_lists_the_sample_function()
        {
            var response = await GetAsync(id => $"/api/databaseSchema/functions/{id}?database=postgres");

            Assert.Contains("smoke_add", await response.Content.ReadAsStringAsync());
        }

        [Fact]
        public async Task Stored_procedures_lists_the_sample_procedure()
        {
            var response = await GetAsync(id => $"/api/databaseSchema/storedProcedures/{id}?database=postgres");

            Assert.Contains("smoke_noop", await response.Content.ReadAsStringAsync());
        }

        private static JsonElement Column(JsonElement columns, string name)
            => columns.EnumerateArray().Single(column => column.GetProperty("columnName").GetString() == name);
    }
}
