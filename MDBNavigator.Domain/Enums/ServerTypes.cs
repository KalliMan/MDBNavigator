namespace MDBNavigator.Domain.Enums
{
    // Maps the server type names used by the API/UI ("PostgreSQL", "MS SQL Server") to ServerType.
    public static class ServerTypes
    {
        private static readonly IReadOnlyDictionary<string, ServerType> ByName = new Dictionary<string, ServerType>
        {
            { "PostgreSQL", ServerType.PostgreSQL },
            { "MS SQL Server", ServerType.MSSQLServer }
        };

        public static bool TryParse(string? name, out ServerType serverType)
        {
            if (name is not null && ByName.TryGetValue(name, out serverType))
            {
                return true;
            }
            serverType = ServerType.None;
            return false;
        }
    }
}
