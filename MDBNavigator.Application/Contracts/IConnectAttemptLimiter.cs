namespace MDBNavigator.Application.Contracts
{
    // Counts failed connects per user. After RateLimiting:FailedConnectsBeforeWait failures, connecting is refused
    // for a while, so the server can't be used to guess database passwords or to scan hosts and ports.
    public interface IConnectAttemptLimiter
    {
        // How long the user still has to wait before connecting again, or null if they may connect now.
        TimeSpan? GetWait(string userId);

        void RecordFailure(string userId);
    }
}
