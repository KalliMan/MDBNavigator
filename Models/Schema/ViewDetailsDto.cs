namespace Models.Schema
{
    public class ViewDetailsDto
    {
        public required string DataSource { get; set; }
        public required string DatabaseName { get; set; }
        public required IEnumerable<ViewDto> Views { get; set; }
    }
}
