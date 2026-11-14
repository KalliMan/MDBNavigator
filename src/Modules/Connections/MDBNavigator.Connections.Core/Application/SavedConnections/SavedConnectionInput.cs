using MDBNavigator.Providers.Abstractions;
using System.Text;

namespace MDBNavigator.Connections.Application.SavedConnections
{
    // What the user enters for a saved connection, as received (not trimmed yet): used by create and update.
    // RememberPassword false: no password is kept (update: a remembered one is forgotten). True: Password, when not
    // empty, is the one to remember; empty keeps the remembered one (update only, and only for the same server and user).
    public record SavedConnectionInput(string Name, ServerType ServerType, string ServerName, int Port,
        string? DatabaseName, string UserName, string? Color, bool RememberPassword, string? Password)
    {
        // Keeps the password out of ToString() (logs, exception messages, debugger output).
        protected virtual bool PrintMembers(StringBuilder builder)
        {
            builder.Append($"Name = {Name}, ServerType = {ServerType}, ServerName = {ServerName}, Port = {Port}, DatabaseName = {DatabaseName}, UserName = {UserName}, Color = {Color}, RememberPassword = {RememberPassword}, Password = ***");
            return true;
        }
    }
}
