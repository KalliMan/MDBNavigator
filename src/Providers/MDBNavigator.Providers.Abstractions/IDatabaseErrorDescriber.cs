using MDBNavigator.Providers.Abstractions.Queries;

namespace MDBNavigator.Providers.Abstractions
{
    // Turns a database provider's exception into a message for the user (e.g. including the server's
    // detail and hint), says why it happened, and where in the script it is. Implemented by the provider, which
    // knows its driver's exception types.
    public interface IDatabaseErrorDescriber
    {
        string Describe(Exception exception);

        // Whether the database refused on purpose (rights, limits) or the SQL was wrong. The public demo counts the
        // first kind against a guest; mistakes don't count.
        DatabaseErrorKind Classify(Exception exception);

        // Where in the script the database says the error is: a 0-based index into script, in UTF-16 code units, so the
        // browser can use it on its own copy of the text as it is. statement: the one that was running. null when the
        // error has no place in the user's own text: a runtime error (division by zero), an error inside a function, or
        // not a database error at all.
        int? OffsetInScript(Exception exception, string script, StatementStarted statement);
    }
}
