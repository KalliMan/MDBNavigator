namespace MDBNavigator.Providers.Abstractions
{
    // Turns a database provider's exception into a message for the user (e.g. including the server's
    // detail and hint), and says why it happened. Implemented by the provider, which knows its driver's exception types.
    public interface IDatabaseErrorDescriber
    {
        string Describe(Exception exception);

        // Whether the database refused on purpose (rights, limits) or the SQL was wrong. The public demo counts the
        // first kind against a guest; mistakes don't count.
        DatabaseErrorKind Classify(Exception exception);
    }
}
