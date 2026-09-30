namespace MDBNavigator.PostgreSQL.Modes
{
    internal class ProcedureRaw
    {
        public required string DatabaseSchema { get; set; }
        public required string Name { get; set; }
        public required string ProcedureType { get; set; }
    }
}
