namespace MDBNavigator.API.DTOs
{
    // Tells the UI which screens to show: mode "Accounts" or "None", sign-up "Open" or "Closed", the external
    // providers that have a button (e.g. ["GitHub", "Google"]), whether email works (confirmation, forgot password),
    // and which CAPTCHA to show: "None", "Turnstile" (rendered with TurnstileSiteKey) or "Altcha", whether saved
    // connections can remember passwords (SavedConnections:PasswordKey is set), and the demo (null when it is off).
    public record AuthSettingsDto(string Mode, string SignUp, IReadOnlyList<string> Providers, bool EmailEnabled,
        string CaptchaProvider, string? TurnstileSiteKey, bool RememberPasswords, DemoSettingsDto? Demo);

    // ContactEmail: for the demo terms. ConnectionName: what the guest's connection is called in the UI.
    // ViolationsBeforeBlock, BlockHours: the rule the start page names (refused actions end the session and block).
    public record DemoSettingsDto(string ContactEmail, int SessionMinutes, string ConnectionName, int ViolationsBeforeBlock, int BlockHours);

    // SignInMethod: how this session signed in, "Password" or a provider name such as "Google"; null when unknown.
    // Guest: set for a demo guest; Email is then a made-up address, and Guest.Name is the visitor's name.
    public record CurrentUserDto(string Email, bool IsAdmin, string? SignInMethod, GuestDto? Guest);

    // SecondsLeft: by the server's clock, so the countdown is right even when the browser's clock is not.
    public record GuestDto(string Name, DateTime EndsAtUtc, int SecondsLeft);

    // CurrentPassword is empty when the account has no password yet (created through a provider).
    public record SetPasswordRequest(string? CurrentPassword, string NewPassword);

    // Password for accounts that have one; otherwise the account's email, typed in as confirmation.
    public record DeleteAccountRequest(string? Password, string? Email);
}
