namespace Models.Schema
{
    public class DbObjectDtoBase
    {
        public required string DatabaseSchema { get; set; }
        public required string Name { get; set; }
    }
}
