using System.Text;

namespace MDBNavigator.API.DTOs
{
    // Body of POST and PUT api/savedConnections. ServerType by name, as in ConnectionSettingsQuery.
    // RememberPassword is required, so every request states what happens to the password: false keeps none (PUT:
    // forgets it); true with Password remembers that one; true without it keeps the remembered one (PUT, same server
    // and user only). Password is ignored unless RememberPassword is true.
    public record SavedConnectionRequest
    {
        public required string Name { get; init; }
        public required string ServerType { get; init; }
        public required string ServerName { get; init; }
        public required int Port { get; init; }
        public string? DatabaseName { get; init; }
        public required string UserName { get; init; }
        public string? Color { get; init; }
        public required bool RememberPassword { get; init; }
        public string? Password { get; init; }

        // Keeps the password out of ToString() (logs, exception messages, debugger output).
        protected virtual bool PrintMembers(StringBuilder builder)
        {
            builder.Append($"Name = {Name}, ServerType = {ServerType}, ServerName = {ServerName}, Port = {Port}, DatabaseName = {DatabaseName}, UserName = {UserName}, Color = {Color}, RememberPassword = {RememberPassword}, Password = ***");
            return true;
        }
    }
}
