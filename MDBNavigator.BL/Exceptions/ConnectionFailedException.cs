namespace MDBNavigator.BL.Exceptions
{
    internal class ConnectionFailedException : Exception
    {
        public ConnectionFailedException(string message, Exception exception)
            : base(message, exception) { }
    }
}
