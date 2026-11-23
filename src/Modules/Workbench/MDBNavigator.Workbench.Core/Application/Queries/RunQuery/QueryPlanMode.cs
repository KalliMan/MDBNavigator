namespace MDBNavigator.Workbench.Application.Queries.RunQuery
{
    // A normal run, or the plan of one statement: Estimate = EXPLAIN, Analyze = EXPLAIN ANALYZE (rolled back).
    public enum QueryPlanMode { None, Estimate, Analyze }
}
