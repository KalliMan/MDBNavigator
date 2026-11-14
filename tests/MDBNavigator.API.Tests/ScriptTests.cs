using MDBNavigator.API.Tests.Infrastructure;
using System.Net;

namespace MDBNavigator.API.Tests
{
    [Collection(ApiCollection.Name)]
    public class ScriptTests
    {
        private readonly AppFixture _fixture;

        public ScriptTests(AppFixture fixture) => _fixture = fixture;

        [Theory]
        [InlineData("tableRecordsScript", "schema=public&table=smoke_items&recordsNumber=10", "smoke_items")]
        [InlineData("createNewTableScript", "schema=public", "create table")]
        [InlineData("createTableScript", "schema=public&table=smoke_items", "create table")]
        [InlineData("dropTableScript", "schema=public&table=smoke_items", "drop table")]
        [InlineData("insertTableScript", "schema=public&table=smoke_items", "insert into")]
        [InlineData("procedureDefinition", "schema=public&name=smoke_add", "smoke_add")]
        [InlineData("createStoredProcedureScript", "schema=public", "procedure")]
        [InlineData("createFunctionScript", "schema=public", "function")]
        [InlineData("dropProcedureScript", "schema=public&name=smoke_noop", "drop")]
        [InlineData("viewDefinition", "schema=public&name=smoke_items_view", "smoke_items")]
        [InlineData("createViewScript", "schema=public", "view")]
        [InlineData("dropViewScript", "schema=public&name=smoke_items_view", "drop view")]
        public async Task Script_endpoints_return_sql(string route, string query, string expected)
        {
            var (session, _, _) = await _fixture.NewUserAsync();
            using var signedIn = session;
            var connectionId = await session.ConnectAsync();

            var response = await session.Client.GetAsync($"/api/databaseCommand/{route}/{connectionId}?database=postgres&{query}")
                .ShouldBeAsync(HttpStatusCode.OK);

            Assert.Contains(expected, await response.Content.ReadAsStringAsync(), StringComparison.OrdinalIgnoreCase);
        }
    }
}
