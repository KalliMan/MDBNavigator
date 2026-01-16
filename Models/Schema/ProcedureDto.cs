namespace Models.Schema
{
    public enum ProcedureType
    {
        Unknown,
        Procedure,
        Function
    }

    public class ProcedureDto : DbObjectDtoBase
    {
        public required ProcedureType ProcedureType { get; set; }
    }
}
