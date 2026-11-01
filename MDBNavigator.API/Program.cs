using MDBNavigator.Application;
using MDBNavigator.Application.Common;
using MDBNavigator.Application.Contracts;
using MDBNavigator.API.Auth;
using MDBNavigator.API.Captcha;
using MDBNavigator.API.Middleware;
using MDBNavigator.API.RateLimiting;
using MDBNavigator.Infrastructure;
using MDBNavigator.Infrastructure.Accounts;
using MDBNavigator.Infrastructure.Captcha;
using MDBNavigator.Infrastructure.Connection;
using MDBNavigator.Infrastructure.PostgreSQL;
using MDBNavigator.Infrastructure.SignalR;
using Microsoft.AspNetCore.HttpOverrides;

var builder = WebApplication.CreateBuilder(args);

var authOptions = builder.Configuration.GetSection(AuthOptions.SectionName).Get<AuthOptions>() ?? new AuthOptions();

builder.Services.AddSingleton(
    builder.Configuration.GetSection(QueryExecutionOptions.SectionName).Get<QueryExecutionOptions>() ?? new QueryExecutionOptions());
builder.Services.AddSingleton(
    builder.Configuration.GetSection(ConnectionCacheOptions.SectionName).Get<ConnectionCacheOptions>() ?? new ConnectionCacheOptions());
var rateLimitingOptions = builder.Configuration.GetSection(RateLimitingOptions.SectionName).Get<RateLimitingOptions>()
    ?? new RateLimitingOptions();
builder.Services.AddSingleton(rateLimitingOptions);
var captchaOptions = builder.Configuration.GetSection(CaptchaOptions.SectionName).Get<CaptchaOptions>() ?? new CaptchaOptions();

// Unless set, the connection guard follows who can get in: only with open sign-up can strangers use the server,
// and then the server's own network (localhost, private ranges) is not theirs to reach. Otherwise the users are the
// machine's owner (Auth:Mode None serves only local requests) or people an admin let in, and they reach everything.
var connectionGuardOptions = builder.Configuration.GetSection(ConnectionGuardOptions.SectionName).Get<ConnectionGuardOptions>()
    ?? new ConnectionGuardOptions();
connectionGuardOptions.Mode ??= authOptions.Mode == AuthMode.Accounts && authOptions.SignUp == SignUpMode.Open
    ? ConnectionGuardMode.Public
    : ConnectionGuardMode.Off;
builder.Services.AddSingleton(connectionGuardOptions);
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices();
builder.Services.AddPostgreSQLProvider();
builder.Services.AddAuth(authOptions, builder.Configuration, builder.Environment);
builder.Services.AddRateLimits(rateLimitingOptions);
builder.Services.AddCaptcha(captchaOptions);

// No CORS: the UI always comes from the API's own origin (production: wwwroot; development: the Vite dev server
// proxies /api and /batchCommandResult), which the SameSite sign-in cookie needs anyway.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

// Created now rather than on the first connection, so a bad ConnectionGuard:Allow entry stops startup
// and the mode in effect is logged.
app.Services.GetRequiredService<IConnectionGuard>();

if (authOptions.Mode == AuthMode.Accounts)
{
    await app.Services.InitializeAccountsDatabaseAsync();
}

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedFor
});

app.UseMiddleware<ExceptionMiddleware>();
if (authOptions.Mode == AuthMode.None)
{
    app.UseMiddleware<LocalRequestsOnlyMiddleware>();
}

// Not in Development: the Vite dev server proxies to the HTTP port (same origin as the page, http://localhost:3000),
// and a redirect to https://localhost:3001 would make every call cross-origin.
if (!app.Environment.IsDevelopment() && builder.Configuration.GetValue<string>("ASPNETCORE_HTTPS_PORT") != null)
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

var hub = app.MapHub<BatchCommandResultHub>("/batchCommandResult");

// The built UI is in wwwroot only when it was built into it (the Dockerfile does that). In development the UI
// runs on the Vite dev server, so there is nothing to serve; skipping this avoids the "WebRootPath was not found" warnings.
var serveUi = Directory.Exists(app.Environment.WebRootPath)
    && File.Exists(Path.Combine(app.Environment.WebRootPath, "index.html"));
if (serveUi)
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
}

var controllers = app.MapControllers();
app.MapAuthEndpoints(authOptions, captchaOptions);
app.MapCaptchaEndpoints(captchaOptions);

// With accounts, everything except the auth endpoints and the UI's files needs sign-in.
if (authOptions.Mode == AuthMode.Accounts)
{
    hub.RequireAuthorization();
    controllers.RequireAuthorization();
}

if (serveUi)
{
    // Client-side routes (anything that is not an API/hub endpoint or a file) get the SPA.
    app.MapFallbackToFile("index.html");
}

app.Run();
