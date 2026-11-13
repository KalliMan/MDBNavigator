using MDBNavigator.Application.DTOs;
using MDBNavigator.Domain.Entities;
using MDBNavigator.Domain.Enums;

namespace MDBNavigator.Application.Features.SavedConnections
{
    // One place that turns input into stored values (trimmed, empty optional values as null, color in lower case)
    // and stored values into the DTO.
    public static class SavedConnectionMapping
    {
        public static string NormalizeName(string name) => name.Trim().ToUpperInvariant();

        // Sets everything the user controls and UpdatedAtUtc. Id, OwnerId and CreatedAtUtc are left alone.
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

        public static SavedConnectionDto ToDto(SavedConnection c) => new(c.Id, c.Name, ServerTypes.NameOf(c.ServerType),
            c.ServerName, c.Port, c.DatabaseName, c.UserName, c.Color);
    }
}
