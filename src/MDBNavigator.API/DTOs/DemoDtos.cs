namespace MDBNavigator.API.DTOs
{
    // The invite form. TermsVersion: the version of the demo terms the visitor agreed to (the UI's DEMO_TERMS_VERSION).
    public record DemoJoinRequest(string? InviteCode, string? Name, string? Email, string? TermsVersion);

    // A returning visitor asks for a new link.
    public record DemoSignInLinkRequest(string? Email, string? TermsVersion);

    // Token: from the emailed link (/demo/start?token=...).
    public record DemoStartRequest(string? Token);
}
