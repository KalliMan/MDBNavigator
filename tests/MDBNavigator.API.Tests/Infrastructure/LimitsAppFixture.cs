namespace MDBNavigator.API.Tests.Infrastructure
{
    [CollectionDefinition(Name)]
    public sealed class LimitsCollection : ICollectionFixture<LimitsAppFixture>
    {
        public const string Name = "API with run limits";
    }

    // A second app and PostgreSQL, with the run limits a public demo sets, scaled down so the tests are quick.
    // A collection of its own: these limits would change what the smoke tests see.
    public sealed class LimitsAppFixture : AppFixture
    {
        public const int MaxRowBytes = 65_536;
        public const int MaxRunSeconds = 3;
        public const int MaxRowsPerRun = 100;
        public const int MaxRowsPerResultSet = 60;

        public LimitsAppFixture() : base(new Dictionary<string, string>
        {
            ["QueryExecution:MaxRowBytes"] = "65536",
            ["QueryExecution:MaxRunSeconds"] = "3",
            ["QueryExecution:MaxRowsPerRun"] = "100",
            ["QueryExecution:MaxRowsPerResultSet"] = "60",
        })
        {
        }
    }
}
