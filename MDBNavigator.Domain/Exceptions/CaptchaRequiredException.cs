namespace MDBNavigator.Domain.Exceptions
{
    // The request needs a solved CAPTCHA (Captcha settings) and had none, or an invalid one; nothing was done.
    // Becomes HTTP 428, which tells the UI to show the CAPTCHA and send the request again.
    public class CaptchaRequiredException : Exception
    {
        public CaptchaRequiredException(string message)
            : base(message)
        {
        }
    }
}
