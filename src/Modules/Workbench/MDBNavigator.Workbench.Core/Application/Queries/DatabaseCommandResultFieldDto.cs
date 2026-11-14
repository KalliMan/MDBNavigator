using MDBNavigator.Providers.Abstractions.Queries;

namespace MDBNavigator.Workbench.Application.Queries
{
    public class DatabaseCommandResultFieldDto
    {
        public int Index { get; set; }
        public required string FieldName { get; set; }
        // Decides how the UI sorts and formats the column; the same set for every database server.
        public required DbTypeCategory Category { get; set; }
        // What the database calls the type ("jsonb", "numeric(10, 2)"). The UI shows it and never interprets it.
        public required string DataTypeName { get; set; }
    }
}
