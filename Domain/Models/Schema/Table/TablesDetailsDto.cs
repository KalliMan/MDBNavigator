using Models.Schema.Base;

namespace Models.Schema.Table
{
    public class TablesDetailsDto : DbObjectDetailsDtoBase
    {
        public required IEnumerable<Table> Tables { get; set; }
    }
}
