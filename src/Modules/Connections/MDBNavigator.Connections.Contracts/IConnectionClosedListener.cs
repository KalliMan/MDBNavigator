namespace MDBNavigator.Connections.Contracts
{
    // Told when the user disconnects a connection, so whatever still uses it can stop (running queries).
    public interface IConnectionClosedListener
    {
        void ConnectionClosed(string sessionId, string connectionId);
    }
}
