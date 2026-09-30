using System.Data;

namespace Models.Command
{
    public class DatabaseCommandResultRaw
    {
        public required int RecordsAffected { get; init; }
        public required IEnumerable<DataTable> Results { get; init; }
    }
}
