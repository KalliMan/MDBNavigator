using System.Data;
namespace Models
{
    public class DatabaseCommandResultRaw
    {
        public required DataTable Result { get; init; }
    }
}
