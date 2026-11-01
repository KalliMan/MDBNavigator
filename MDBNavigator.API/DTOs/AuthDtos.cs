namespace MDBNavigator.API.DTOs
{
    // Tells the UI which screens to show: mode "Accounts" or "None", sign-up "Open" or "Closed", the external
    // providers that have a button (e.g. ["GitHub", "Google"]), whether email works (confirmation, forgot password),
    // and which CAPTCHA to show: "None", "Turnstile" (rendered with TurnstileSiteKey) or "Altcha".
    public record AuthSettingsDto(string Mode, string SignUp, IReadOnlyList<string> Providers, bool EmailEnabled,
        string CaptchaProvider, string? TurnstileSiteKey);

    // SignInMethod: how this session signed in, "Password" or a provider name such as "Google"; null when unknown.
    public record CurrentUserDto(string Email, bool IsAdmin, string? SignInMethod);

    // CurrentPassword is empty when the account has no password yet (created through a provider).
    public record SetPasswordRequest(string? CurrentPassword, string NewPassword);

    // Password for accounts that have one; otherwise the account's email, typed in as confirmation.
    public record DeleteAccountRequest(string? Password, string? Email);
}
