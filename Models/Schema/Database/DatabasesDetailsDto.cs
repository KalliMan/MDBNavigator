namespace Models.Schema.Database
{
    public class DatabasesDetailsDto
    {
        public string ConnectionId { get; set; } = string.Empty;
        public required string DataSource { get; set; }
        public required IEnumerable<DatabaseDto> Databases { get; set; }

    }
}
