using System.Text;

namespace MDBNavigator.API.DTOs
{
    public record ConnectionSettingsQuery
    {
        public required string ServerType { get; set; }
        public required string ServerName { get; set; }
        public required int Port { get; set; }
        public required string UserName { get; set; }
        public required string Password { get; set; }

        // Keeps the password out of ToString() (logs, exception messages, debugger output).
        protected virtual bool PrintMembers(StringBuilder builder)
        {
            builder.Append($"ServerType = {ServerType}, ServerName = {ServerName}, Port = {Port}, UserName = {UserName}, Password = ***");
            return true;
        }
    }
}
