namespace Models
{
    public class DatabasesDetailsDto
    {
        public required string DataSource { get; set; }
        public required IEnumerable<DatabaseDto> Databases { get; set; }

    }
}
