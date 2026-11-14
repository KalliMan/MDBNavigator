namespace MDBNavigator.Providers.Abstractions.Schema
{
    public class DbObjectBase
    {
        public required string DatabaseSchema { get; set; }
        public required string Name { get; set; }
    }
}
