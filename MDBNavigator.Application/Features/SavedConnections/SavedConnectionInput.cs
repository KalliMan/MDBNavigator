using MDBNavigator.Domain.Enums;

namespace MDBNavigator.Application.Features.SavedConnections
{
    // What the user enters for a saved connection, as received (not trimmed yet): used by create and update.
    public record SavedConnectionInput(string Name, ServerType ServerType, string ServerName, int Port,
        string? DatabaseName, string UserName, string? Color);
}
