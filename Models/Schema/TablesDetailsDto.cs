namespace Models.Schema
{
    public class TablesDetailsDto
    {
        public required string DataSource { get; set; }
        public required string DatabaseName { get; set; }
        public required IEnumerable<TableDto> Tables { get; set; }
    }
}
