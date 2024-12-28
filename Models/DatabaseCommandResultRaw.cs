using System.Data;
namespace Models
{
    public class DatabaseCommandResultRaw
    {
        public required int RecordsAffected { get; init; }
        public required DataTable Result { get; init; }
    }
}
