using System.Data;
namespace Models
{
    public class DatabaseCommandResultRaw
    {
        public required string Script {  get; set; }
        public required DataTable Result { get; init; }
    }
}
