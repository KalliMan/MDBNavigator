namespace MDBNavigator.Domain.Schema.Base
{
    public class DbObjectBase
    {
        public required string DatabaseSchema { get; set; }
        public required string Name { get; set; }
    }
}
