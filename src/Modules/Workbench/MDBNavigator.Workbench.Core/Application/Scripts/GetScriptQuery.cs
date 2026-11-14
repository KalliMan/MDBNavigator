using MDBNavigator.SharedKernel.Messaging;

namespace MDBNavigator.Workbench.Application.Scripts
{
    // Name: the table, view or routine, for the kinds that are about an existing object. RecordsNumber: TopNTableRecords only.
    public record GetScriptQuery(string SessionId, string ConnectionId, string DatabaseName, ScriptKind Kind, string Schema,
        string? Name = null, int? RecordsNumber = null) : IQuery<string>, IConnectionRequest;
}
