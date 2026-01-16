namespace Models.Schema
{
    public class TablesDetailsDto : DbObjectDetailsDtoBase
    {
        public required IEnumerable<TableDto> Tables { get; set; }
    }
}
