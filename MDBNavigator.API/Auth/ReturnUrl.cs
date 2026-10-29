namespace MDBNavigator.API.Auth
{
    // Where the browser goes after signing in. Only paths on this site are allowed, so a link can't send a freshly
    // signed-in user to another site (open redirect).
    public static class ReturnUrl
    {
        public static string Sanitize(string? returnTo)
            => returnTo is { Length: > 0 }
                && returnTo[0] == '/'
                // "//host" and "/\host" are other sites to a browser, and browsers drop tabs and line breaks
                // ("/\t/host" becomes "//host").
                && !returnTo.StartsWith("//", StringComparison.Ordinal)
                && !returnTo.Any(c => c == '\\' || char.IsControl(c) || char.IsWhiteSpace(c))
                ? returnTo
                : "/";
    }
}
