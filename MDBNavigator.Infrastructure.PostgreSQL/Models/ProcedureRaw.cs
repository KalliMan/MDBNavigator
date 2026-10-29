namespace MDBNavigator.Infrastructure.PostgreSQL.Models
{
    internal class ProcedureRaw
    {
        public required string DatabaseSchema { get; set; }
        public required string Name { get; set; }
        public required string ProcedureType { get; set; }
    }
}
