using MDBNavigator.Application.Common;
using MDBNavigator.Application.Contracts;
using Microsoft.Extensions.Logging;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace MDBNavigator.Infrastructure.Captcha
{
    // Cloudflare Turnstile: the widget gives the browser a token, and Cloudflare's siteverify says whether it is
    // valid. Cloudflare also makes each token single-use and lets it expire after 5 minutes.
    public class TurnstileVerifier : ICaptchaVerifier
    {
        private const string SiteVerifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
        // Cloudflare's documented maximum; anything longer isn't a token and isn't worth a request.
        private const int MaxTokenLength = 2048;

        private sealed record SiteVerifyResponse(
            bool Success,
            [property: JsonPropertyName("error-codes")] string[]? ErrorCodes);

        private readonly HttpClient _http;
        private readonly string _secretKey;
        private readonly ILogger<TurnstileVerifier> _logger;

        public TurnstileVerifier(HttpClient http, CaptchaOptions options, ILogger<TurnstileVerifier> logger)
        {
            _http = http;
            _secretKey = options.Turnstile.SecretKey
                ?? throw new InvalidOperationException("Captcha:Turnstile:SecretKey is not set.");
            _logger = logger;
        }

        public bool Enabled => true;

        public async Task<bool> VerifyAsync(string? token, CancellationToken ct = default)
        {
            if (string.IsNullOrEmpty(token) || token.Length > MaxTokenLength)
            {
                return false;
            }

            // The visitor's IP address (remoteip) is optional and left out: Cloudflare doesn't need it to check the token.
            using var content = new FormUrlEncodedContent([
                new KeyValuePair<string, string>("secret", _secretKey),
                new KeyValuePair<string, string>("response", token)
            ]);
            try
            {
                using var response = await _http.PostAsync(SiteVerifyUrl, content, ct);
                response.EnsureSuccessStatusCode();
                var result = await response.Content.ReadFromJsonAsync<SiteVerifyResponse>(ct);
                if (result?.Success == true)
                {
                    return true;
                }

                _logger.LogInformation("Turnstile refused a token: {ErrorCodes}", string.Join(", ", result?.ErrorCodes ?? []));
                return false;
            }
            catch (Exception ex) when (ex is HttpRequestException or JsonException
                || (ex is TaskCanceledException && !ct.IsCancellationRequested))
            {
                // Fail closed: if Cloudflare can't be asked, the CAPTCHA doesn't pass. Letting it pass would switch
                // the protection off for anyone who can make the check fail.
                _logger.LogWarning(ex, "Turnstile could not be reached, so the CAPTCHA did not pass");
                return false;
            }
        }
    }
}
