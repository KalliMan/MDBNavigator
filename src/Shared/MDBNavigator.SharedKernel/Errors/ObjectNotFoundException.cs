namespace MDBNavigator.SharedKernel.Errors
{
    // A requested object (a table, view or routine, a saved connection...) does not exist; mapped to HTTP 404.
    public class ObjectNotFoundException : Exception
    {
        public ObjectNotFoundException(string message) : base(message) { }
    }
}
