namespace MDBNavigator.API.DTOs
{
    // Tells the UI which screens to show: mode "Accounts" or "None", sign-up "Open" or "Closed", and the external
    // providers that have a button (e.g. ["GitHub", "Google"]).
    public record AuthSettingsDto(string Mode, string SignUp, IReadOnlyList<string> Providers);

    public record CurrentUserDto(string Email, bool IsAdmin);
}
