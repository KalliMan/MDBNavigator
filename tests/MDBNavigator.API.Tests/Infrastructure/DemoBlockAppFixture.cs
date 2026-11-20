namespace MDBNavigator.API.Tests.Infrastructure
{
    [CollectionDefinition(Name)]
    public sealed class DemoBlockCollection : ICollectionFixture<DemoBlockAppFixture>
    {
        public const string Name = "API with demo blocks";
    }

    // The demo with a block after only a few refused actions, so the tests are short. An app of its own: blocks and the
    // moved clock would change what the other demo tests see.
    public sealed class DemoBlockAppFixture : DemoAppFixture
    {
        public const int ViolationsBeforeBlock = 3;
        public const int BlockHours = 24;

        protected override IReadOnlyDictionary<string, string> AppSettings() => new Dictionary<string, string>(base.AppSettings())
        {
            ["Demo:ViolationsBeforeBlock"] = ViolationsBeforeBlock.ToString(),
            ["Demo:BlockHours"] = BlockHours.ToString(),
        };
    }
}
