using System.Data;

namespace MDBNavigator.Application.DTOs.Command
{
    public class DatabaseSingleCommandResultRaw
    {
        public required int RecordsAffected { get; init; }
        public required DataTable Result { get; init; }
    }
}
