namespace MDBNavigator.Connections.Application.SavedConnections
{
    // ServerType by its API name ("PostgreSQL"). Never the password, only whether one is remembered (and readable with
    // the current key). No timestamps (see the 1.2a plan).
    public record SavedConnectionDto(Guid Id, string Name, string ServerType, string ServerName, int Port,
        string? DatabaseName, string UserName, string? Color, bool HasPassword);
}
