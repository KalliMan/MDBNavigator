using MDBNavigator.Connections.Contracts;
using MDBNavigator.Providers.Abstractions;

namespace MDBNavigator.Workbench.Application.Scripts
{
    public class GetScriptHandler : ConnectionRequestHandler<GetScriptQuery, string>
    {
        public GetScriptHandler(IDatabaseConnector connector) : base(connector) { }

        protected override Task<string> Handle(GetScriptQuery request, IDatabaseClient database, CancellationToken cancellationToken)
        {
            var scripts = database.Scripts;
            var schema = request.Schema;

            // Each arm reads the name only if its kind needs one, so the kinds without an object name never ask for it.
            return request.Kind switch
            {
                ScriptKind.TopNTableRecords => Task.FromResult(scripts.GetTopNTableRecordsScript(schema, NameOf(request), request.RecordsNumber)),
                ScriptKind.CreateNewTable => Task.FromResult(scripts.GetCreateNewTableScript(schema)),
                ScriptKind.CreateTable => scripts.GetCreateTableScript(schema, NameOf(request), cancellationToken),
                ScriptKind.DropTable => Task.FromResult(scripts.GetDropTableScript(schema, NameOf(request))),
                ScriptKind.InsertTable => scripts.GetInsertTableScript(schema, NameOf(request), cancellationToken),
                ScriptKind.CreateStoredProcedure => Task.FromResult(scripts.GetCreateStoredProcedureScript(schema)),
                ScriptKind.CreateFunction => Task.FromResult(scripts.GetCreateFunctionScript(schema)),
                ScriptKind.ProcedureDefinition => scripts.GetProcedureDefinition(schema, NameOf(request), cancellationToken),
                ScriptKind.DropProcedure => scripts.GetDropProcedureScript(schema, NameOf(request), cancellationToken),
                ScriptKind.ViewDefinition => scripts.GetViewDefinition(schema, NameOf(request), cancellationToken),
                ScriptKind.CreateView => Task.FromResult(scripts.GetCreateViewScript(schema)),
                ScriptKind.DropView => Task.FromResult(scripts.GetDropViewScript(schema, NameOf(request))),
                _ => throw new ArgumentOutOfRangeException(nameof(request), request.Kind, "Unknown script kind.")
            };
        }

        // The controller always sends the name; a request without one is a caller's mistake (400 through the middleware).
        private static string NameOf(GetScriptQuery request)
            => request.Name ?? throw new ArgumentException("Name is required for this script.", nameof(request));
    }
}
