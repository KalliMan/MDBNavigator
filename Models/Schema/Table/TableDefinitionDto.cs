namespace Models.Schema.Table
{
    public class TableDefinitionDto
    {
        public required string ConnectionId { get; set; }
        public required string DatabaseName { get; set; }
        public required string DatabaseSchema { get; set; }
        public required string Name { get; set; }

        public required IEnumerable<TableColumn> Columns { get; set; }
        public IEnumerable<TableIndex>? Indexes{ get; set; }
    }
}
