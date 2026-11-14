namespace MDBNavigator.Connections.Contracts
{
    public class ConnectionFailedException : Exception
    {
        public ConnectionFailedException(string message, Exception innerException)
            : base(message, innerException) { }
    }
}
