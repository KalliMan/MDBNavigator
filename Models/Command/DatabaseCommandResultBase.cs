namespace Models.Command
{
    public class DatabaseCommandResultBase
    {
        public required string Id { get; init; }
        public required string ResultJson { get; init; }
    }
}
