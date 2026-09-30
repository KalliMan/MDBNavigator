using Models.Schema.Base;

namespace Models.Schema.Procedure
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
