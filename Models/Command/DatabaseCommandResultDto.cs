namespace Models.Command
{
    public class DatabaseCommandResultDto
    {
        public required string Id { get; init; }
        public IEnumerable<DatabaseSingleCommandResultDto>? Results { get; init; }
    }
}
