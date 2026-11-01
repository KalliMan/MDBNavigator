using MDBNavigator.Application.Contracts;

namespace MDBNavigator.Infrastructure.Captcha
{
    // Captcha:Provider None. Nothing asks for a token, so VerifyAsync is never meant to pass.
    public class NoCaptcha : ICaptchaVerifier
    {
        public bool Enabled => false;

        public Task<bool> VerifyAsync(string? token, CancellationToken ct = default) => Task.FromResult(false);
    }
}
