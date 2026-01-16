namespace Models.Schema
{
    public class ViewDetailsDto : DbObjectDetailsDtoBase
    {
        public required IEnumerable<ViewDto> Views { get; set; }
    }
}
