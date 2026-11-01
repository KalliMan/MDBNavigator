namespace MDBNavigator.Application.Contracts
{
    // Checks the token the browser got from the CAPTCHA widget (Captcha:Provider).
    public interface ICaptchaVerifier
    {
        // False with Captcha:Provider None: nothing is asked, and the failed-connect wait applies as usual.
        bool Enabled { get; }

        // True only for a valid token that wasn't used before. A token works once.
        Task<bool> VerifyAsync(string? token, CancellationToken ct = default);
    }
}
