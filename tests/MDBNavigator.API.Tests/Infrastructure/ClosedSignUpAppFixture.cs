namespace MDBNavigator.API.Tests.Infrastructure
{
    [CollectionDefinition(Name)]
    public sealed class ClosedSignUpCollection : ICollectionFixture<ClosedSignUpAppFixture>
    {
        public const string Name = "API with sign-up closed";
    }

    // An app where only the admin account exists and nobody can register. A collection of its own: the main app has
    // open sign-up, and every test there creates its own account.
    public sealed class ClosedSignUpAppFixture : AppFixture
    {
        public ClosedSignUpAppFixture() : base(new Dictionary<string, string>
        {
            ["Auth:SignUp"] = "Closed",
        })
        {
        }
    }
}
