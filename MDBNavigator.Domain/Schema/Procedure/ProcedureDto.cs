using MDBNavigator.Domain.Schema.Base;

namespace MDBNavigator.Domain.Schema.Procedure
{
    public enum ProcedureType { Unknown, Procedure, Function }

    public class ProcedureDto : DbObjectBase
    {
        public required ProcedureType ProcedureType { get; set; }
    }
}
