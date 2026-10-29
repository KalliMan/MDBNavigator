namespace MDBNavigator.Application.Common
{
    // A session is one browser tab of one user: "{userId}:{tabId}". Connections, running queries and result messages
    // are scoped to it, so knowing a tab id (which the browser sends) never gives access to another user's data.
    public static class SessionKey
    {
        // Auth:Mode = None has no accounts: every request comes from the local machine and acts as this user.
        public const string LocalUserId = "local";

        public static string Create(string userId, string tabId) => $"{userId}:{tabId}";
    }
}
