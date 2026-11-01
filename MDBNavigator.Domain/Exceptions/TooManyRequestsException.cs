namespace MDBNavigator.Domain.Exceptions
{
    // A rate limit refused the request (RateLimiting settings); nothing was done. Becomes HTTP 429.
    public class TooManyRequestsException : Exception
    {
        public TooManyRequestsException(string message, TimeSpan? retryAfter = null)
            : base(message)
        {
            RetryAfter = retryAfter;
        }

        // How long until the request can succeed, when known (sent as the Retry-After header).
        public TimeSpan? RetryAfter { get; }
    }
}
