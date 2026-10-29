using MDBNavigator.Application.DTOs.Schema.Base;
using MDBNavigator.Domain.Schema.Procedure;

namespace MDBNavigator.Application.DTOs.Schema.Procedure
{
    public class ProceduresDetailsDto : DbObjectDetailsDtoBase
    {
        public required IEnumerable<DbProcedure> Procedures { get; set; }
    }
}
