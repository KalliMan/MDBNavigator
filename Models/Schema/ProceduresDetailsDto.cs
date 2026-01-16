namespace Models.Schema
{
    public class ProceduresDetailsDto : DbObjectDetailsDtoBase
    {
        public required IEnumerable<ProcedureDto> Procedures { get; set; }
    }
}
