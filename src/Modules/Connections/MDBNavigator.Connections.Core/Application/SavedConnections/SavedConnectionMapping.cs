using MDBNavigator.Connections.Domain;
using MDBNavigator.Providers.Abstractions;

namespace MDBNavigator.Connections.Application.SavedConnections
{
    // One place that turns input into stored values (trimmed, empty optional values as null, color in lower case)
    // and stored values into the DTO.
    public static class SavedConnectionMapping
    {
        public static string NormalizeName(string name) => name.Trim().ToUpperInvariant();

        // Sets everything the user controls and UpdatedAtUtc. Id, OwnerId and CreatedAtUtc are left alone, and so is
        // ProtectedPassword: the create and update handlers decide what happens to it.
        public static void Apply(SavedConnectionInput input, SavedConnection target, DateTime nowUtc)
        {
            target.Name = input.Name.Trim();
            target.NormalizedName = NormalizeName(input.Name);
            target.ServerType = input.ServerType;
            target.ServerName = input.ServerName.Trim();
            target.Port = input.Port;
            target.DatabaseName = string.IsNullOrWhiteSpace(input.DatabaseName) ? null : input.DatabaseName.Trim();
            target.UserName = input.UserName.Trim();
            target.Color = string.IsNullOrWhiteSpace(input.Color) ? null : input.Color.Trim().ToLowerInvariant();
            target.UpdatedAtUtc = nowUtc;
        }

        // HasPassword: remembered and written with the current key. A value from another key is reported as none, the
        // same way connect treats it.
        public static SavedConnectionDto ToDto(SavedConnection c, ISavedPasswordProtector passwords) => new(c.Id, c.Name,
            ServerTypes.NameOf(c.ServerType), c.ServerName, c.Port, c.DatabaseName, c.UserName, c.Color,
            HasPassword: c.ProtectedPassword is { } p && passwords.IsCurrent(p));
    }
}
