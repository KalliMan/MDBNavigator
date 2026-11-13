namespace MDBNavigator.API.DTOs
{
    // Body of POST and PUT api/savedConnections. ServerType by name, as in ConnectionSettingsQuery. There is no
    // password: an extra "password" property in the JSON is ignored, so it is never stored.
    public record SavedConnectionRequest
    {
        public required string Name { get; init; }
        public required string ServerType { get; init; }
        public required string ServerName { get; init; }
        public required int Port { get; init; }
        public string? DatabaseName { get; init; }
        public required string UserName { get; init; }
        public string? Color { get; init; }
    }
}
