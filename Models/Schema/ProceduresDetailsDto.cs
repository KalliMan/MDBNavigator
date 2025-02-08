namespace Models.Schema
{
    public class ProceduresDetailsDto
    {
        public required string DataSource { get; set; }
        public required string DatabaseName { get; set; }
        public required IEnumerable<ProcedureDto> Procedures { get; set; }
    }
}
