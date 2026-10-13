namespace MDBNavigator.Domain.Schema.Table
{
    public class TableDefinition
    {
        public required IEnumerable<TableColumn> Columns { get; set; }
        public IEnumerable<TableIndex>? Indexes { get; set; }
        public IEnumerable<TableConstraint>? Constraints { get; set; }
    }

    public class TableColumn
    {
        public required string ColumnName { get; set; }
        public required string DataType { get; set; }
        public int? MaxLength { get; set; }
        public bool IsNullable { get; set; }
    }

    public enum IndexType { Regular = 0, Unique = 1, PrimaryKey = 2, UniqueConstraint = 3 }

    public class TableIndex
    {
        public required string IndexName { get; set; }
        public required bool IsUnique { get; set; }
        public IndexType IndexType { get; set; }
    }

    public class TableConstraint
    {
        public required string ConstraintName { get; set; }
        public required string ConstraintType { get; set; }
    }
}
