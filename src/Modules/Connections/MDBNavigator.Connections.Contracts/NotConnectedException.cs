namespace MDBNavigator.Connections.Contracts
{
    public class NotConnectedException : Exception
    {
        public NotConnectedException(string message) : base(message) { }
    }
}
