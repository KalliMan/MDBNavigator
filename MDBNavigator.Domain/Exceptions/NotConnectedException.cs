namespace MDBNavigator.Domain.Exceptions
{
    public class NotConnectedException : Exception
    {
        public NotConnectedException(string message) : base(message) { }
    }
}
