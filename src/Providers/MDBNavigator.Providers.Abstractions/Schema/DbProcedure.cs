namespace MDBNavigator.Providers.Abstractions.Schema
{
    public enum ProcedureType { Unknown, Procedure, Function }

    public class DbProcedure : DbObjectBase
    {
        public required ProcedureType ProcedureType { get; set; }
    }
}
