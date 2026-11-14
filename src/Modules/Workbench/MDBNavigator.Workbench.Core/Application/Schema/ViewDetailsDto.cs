using MDBNavigator.Providers.Abstractions.Schema;

namespace MDBNavigator.Workbench.Application.Schema
{
    public class ViewDetailsDto : DbObjectDetailsDtoBase
    {
        public required IEnumerable<DbView> Views { get; set; }
    }
}
