namespace MDBNavigator.Providers.Abstractions
{
    // A table, view or routine the request names does not exist in the database. The API answers 404.
    public class DatabaseObjectNotFoundException : Exception
    {
        public DatabaseObjectNotFoundException(string message) : base(message) { }
    }
}
