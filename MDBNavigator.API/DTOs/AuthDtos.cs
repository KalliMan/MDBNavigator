namespace MDBNavigator.API.DTOs
{
    // Tells the UI which screens to show: mode "Accounts" or "None", sign-up "Open" or "Closed", the external
    // providers that have a button (e.g. ["GitHub", "Google"]), and whether email works (confirmation, forgot password).
    public record AuthSettingsDto(string Mode, string SignUp, IReadOnlyList<string> Providers, bool EmailEnabled);

    public record CurrentUserDto(string Email, bool IsAdmin);
}
