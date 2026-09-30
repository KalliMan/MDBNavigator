namespace MDBNavigator.Domain.Exceptions
{
    public class ConnectionFailedException : Exception
    {
        public ConnectionFailedException(string message, Exception innerException)
            : base(message, innerException) { }
    }
}
