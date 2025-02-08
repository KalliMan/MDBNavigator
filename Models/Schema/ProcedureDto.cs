namespace Models.Schema
{
    public enum ProcedureType
    {
        Unknown,
        Procedure,
        Function
    }

    public class ProcedureDto
    {
        public required string DatabaseSchema { get; set; }
        public required string Name { get; set; }
        public required ProcedureType ProcedureType { get; set; }
    }
}
