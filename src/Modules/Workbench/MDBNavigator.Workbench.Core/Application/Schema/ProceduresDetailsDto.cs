using MDBNavigator.Providers.Abstractions.Schema;

namespace MDBNavigator.Workbench.Application.Schema
{
    public class ProceduresDetailsDto : DbObjectDetailsDtoBase
    {
        public required IEnumerable<DbProcedure> Procedures { get; set; }
    }
}
