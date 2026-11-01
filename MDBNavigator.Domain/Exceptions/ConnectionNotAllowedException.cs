namespace MDBNavigator.Domain.Exceptions
{
    // The connection guard refused the host (ConnectionGuard settings); no connection was attempted.
    public class ConnectionNotAllowedException : Exception
    {
        public ConnectionNotAllowedException(string message)
            : base(message) { }
    }
}
