namespace MDBNavigator.Providers.Abstractions
{
    // The script can't be run the way it was asked (e.g. a plan of more than one statement). The message is for the
    // user, as it is; it is a mistake in the request, not a fault of the server.
    public class InvalidScriptException : Exception
    {
        public InvalidScriptException(string message) : base(message) { }
    }
}
