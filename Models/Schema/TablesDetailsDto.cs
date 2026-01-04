namespace Models.Schema
{
    public class TablesDetailsDto
    {
        public string ConnectionId { get; set; } = string.Empty;
        public required string DataSource { get; set; }
        public required string DatabaseName { get; set; }
        public required IEnumerable<TableDto> Tables { get; set; }
    }
}
