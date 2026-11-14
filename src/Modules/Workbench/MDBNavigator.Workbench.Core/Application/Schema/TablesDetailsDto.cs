using MDBNavigator.Providers.Abstractions.Schema;

namespace MDBNavigator.Workbench.Application.Schema
{
    public class TablesDetailsDto : DbObjectDetailsDtoBase
    {
        public required IEnumerable<DbTable> Tables { get; set; }
    }
}
