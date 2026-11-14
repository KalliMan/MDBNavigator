namespace MDBNavigator.Providers.Abstractions
{
    // One open connection to one database. Disposing it closes the connection.
    public interface IDatabaseClient : IAsyncDisposable
    {
        string DataSource { get; }
        ISchemaReader Schema { get; }
        IScriptGenerator Scripts { get; }
        IQueryRunner Queries { get; }
    }
}
