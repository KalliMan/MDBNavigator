namespace MDBNavigator.Domain.Exceptions
{
    // A requested database object (table, view, routine...) does not exist; mapped to HTTP 404.
    public class ObjectNotFoundException : Exception
    {
        public ObjectNotFoundException(string message) : base(message) { }
    }
}
