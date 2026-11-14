namespace MDBNavigator.Workbench.Application.Scripts
{
    // The scripts the tree's context menu offers. One value per route of DatabaseCommandController.
    public enum ScriptKind
    {
        TopNTableRecords,
        CreateNewTable,
        CreateTable,
        DropTable,
        InsertTable,
        CreateStoredProcedure,
        CreateFunction,
        ProcedureDefinition,
        DropProcedure,
        ViewDefinition,
        CreateView,
        DropView
    }
}
