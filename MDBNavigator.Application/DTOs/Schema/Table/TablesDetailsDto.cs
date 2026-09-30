using MDBNavigator.Application.DTOs.Schema.Base;
using MDBNavigator.Domain.Schema.Table;

namespace MDBNavigator.Application.DTOs.Schema.Table
{
    public class TablesDetailsDto : DbObjectDetailsDtoBase
    {
        public required IEnumerable<DbTable> Tables { get; set; }
    }
}
