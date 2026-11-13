namespace MDBNavigator.Application.DTOs
{
    // ServerType by its API name ("PostgreSQL"). No password, and no timestamps (see the 1.2a plan).
    public record SavedConnectionDto(Guid Id, string Name, string ServerType, string ServerName, int Port,
        string? DatabaseName, string UserName, string? Color);
}
