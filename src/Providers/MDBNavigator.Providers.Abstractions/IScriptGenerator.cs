namespace MDBNavigator.Providers.Abstractions
{
    // SQL text for the editor: templates, and the definitions of existing objects.
    // Throws DatabaseObjectNotFoundException when the named object does not exist.
    public interface IScriptGenerator
    {
        string GetTopNTableRecordsScript(string schema, string table, int? recordsNumber);
        string GetCreateNewTableScript(string schema);
        Task<string> GetCreateTableScript(string schema, string table, CancellationToken ct = default);
        string GetDropTableScript(string schema, string table);
        Task<string> GetInsertTableScript(string schema, string table, CancellationToken ct = default);

        string GetCreateStoredProcedureScript(string schema);
        string GetCreateFunctionScript(string schema);
        Task<string> GetProcedureDefinition(string schema, string name, CancellationToken ct = default);
        Task<string> GetDropProcedureScript(string schema, string name, CancellationToken ct = default);

        Task<string> GetViewDefinition(string schema, string name, CancellationToken ct = default);
        string GetCreateViewScript(string schema);
        string GetDropViewScript(string schema, string name);
    }
}
