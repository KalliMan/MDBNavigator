using Models.Schema.Base;

namespace Models.Schema.Procedure
{
    public class ProceduresDetailsDto : DbObjectDetailsDtoBase
    {
        public required IEnumerable<ProcedureDto> Procedures { get; set; }
    }
}
