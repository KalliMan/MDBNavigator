using MDBNavigator.Application.Common;
using MDBNavigator.Application.Contracts;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace MDBNavigator.Infrastructure.Captcha
{
    public static class CaptchaServiceRegistration
    {
        // A misconfigured CAPTCHA stops the app at startup: running without the protection someone switched on, or
        // refusing every sign-up, would both go unnoticed until someone complains.
        public static IServiceCollection AddCaptcha(this IServiceCollection services, CaptchaOptions options)
        {
            services.AddSingleton(options);

            switch (options.Provider)
            {
                case CaptchaProvider.Turnstile:
                    if (string.IsNullOrWhiteSpace(options.Turnstile.SiteKey) || string.IsNullOrWhiteSpace(options.Turnstile.SecretKey))
                    {
                        throw new InvalidOperationException(
                            "Captcha:Provider is Turnstile, but Captcha:Turnstile:SiteKey or Captcha:Turnstile:SecretKey is not set.");
                    }
                    services.AddHttpClient<ICaptchaVerifier, TurnstileVerifier>(http => http.Timeout = TimeSpan.FromSeconds(10));
                    break;

                case CaptchaProvider.Altcha:
                    // One instance: it holds the signing key and the used challenges.
                    services.TryAddSingleton(TimeProvider.System);
                    services.AddSingleton<AltchaCaptcha>();
                    services.AddSingleton<ICaptchaVerifier>(sp => sp.GetRequiredService<AltchaCaptcha>());
                    break;

                default:
                    services.AddSingleton<ICaptchaVerifier, NoCaptcha>();
                    break;
            }

            return services;
        }
    }
}
