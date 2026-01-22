using System.Data;
namespace Models.Command
{
    public class DatabaseSingleCommandResultRaw
    {
        public required int RecordsAffected { get; init; }
        public required DataTable Result { get; init; }
    }
}
