namespace Models.Command
{
    public class DatabaseCommandResultFieldDto
    {
        public int Index { get; set; }
        public required string FieldName { get; set; }
        public required string FieldType { get; set; }
        public required string FieldDataTypeName { get; set; }
    }
}
