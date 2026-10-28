namespace MDBNavigator.Application.Contracts
{
    // Turns a database provider's exception into a message for the user (e.g. including the server's
    // detail and hint). Implemented by the provider, which knows its driver's exception types.
    public interface IDatabaseErrorDescriber
    {
        string Describe(Exception exception);
    }
}
