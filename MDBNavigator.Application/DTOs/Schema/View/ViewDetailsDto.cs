using MDBNavigator.Application.DTOs.Schema.Base;
using MDBNavigator.Domain.Schema.View;

namespace MDBNavigator.Application.DTOs.Schema.View
{
    public class ViewDetailsDto : DbObjectDetailsDtoBase
    {
        public required IEnumerable<ViewDto> Views { get; set; }
    }
}
