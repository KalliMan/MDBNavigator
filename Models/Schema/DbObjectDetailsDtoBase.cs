namespace Models.Schema
{
    public class DbObjectDetailsDtoBase
    {
        public required string ConnectionId { get; set; }
        public required string DataSource { get; set; }
        public required string DatabaseName { get; set; }
    }
}
