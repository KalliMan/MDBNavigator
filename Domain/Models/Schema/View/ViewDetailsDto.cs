using Models.Schema.Base;

namespace Models.Schema.View
{
    public class ViewDetailsDto : DbObjectDetailsDtoBase
    {
        public required IEnumerable<ViewDto> Views { get; set; }
    }
}
