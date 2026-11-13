namespace MDBNavigator.Domain.Exceptions
{
    // The request is valid but clashes with what is stored (a duplicate name, a full list); mapped to HTTP 409.
    public class ConflictException : Exception
    {
        public ConflictException(string message) : base(message) { }
    }
}
