using MDBNavigator.API;
using MDBNavigator.API.Auth;
using MDBNavigator.API.Captcha;
using MDBNavigator.API.Middleware;
using MDBNavigator.API.RateLimiting;
using MDBNavigator.Connections.Application;
using MDBNavigator.Connections.Application.SavedConnections;
using MDBNavigator.Connections.Infrastructure;
using MDBNavigator.Connections.Infrastructure.Persistence;
using MDBNavigator.Accounts;
using MDBNavigator.Providers.PostgreSQL;
using MDBNavigator.SharedKernel;
using MDBNavigator.Workbench.Infrastructure;
using MDBNavigator.Workbench.Infrastructure.SignalR;
using Microsoft.AspNetCore.HttpOverrides;

var builder = WebApplication.CreateBuilder(args);

// The Server header only tells an attacker which web server to look up exploits for.
builder.WebHost.ConfigureKestrel(kestrel => kestrel.AddServerHeader = false);

var authOptions = builder.Configuration.GetSection(AuthOptions.SectionName).Get<AuthOptions>() ?? new AuthOptions();
var appDbConnectionString = AppDb.ResolveConnectionString(builder.Configuration, builder.Environment);

var rateLimitingOptions = builder.Configuration.GetSection(RateLimitingOptions.SectionName).Get<RateLimitingOptions>()
    ?? new RateLimitingOptions();
var captchaOptions = builder.Configuration.GetSection(CaptchaOptions.SectionName).Get<CaptchaOptions>() ?? new CaptchaOptions();

// Unless set, the connection guard follows who can get in: only with open sign-up can strangers use the server,
// and then the server's own network (localhost, private ranges) is not theirs to reach. Otherwise the users are the
// machine's owner (Auth:Mode None serves only local requests) or people an admin let in, and they reach everything.
var connectionGuardOptions = builder.Configuration.GetSection(ConnectionGuardOptions.SectionName).Get<ConnectionGuardOptions>()
    ?? new ConnectionGuardOptions();
connectionGuardOptions.Mode ??= authOptions.Mode == AuthMode.Accounts && authOptions.SignUp == SignUpMode.Open
    ? ConnectionGuardMode.Public
    : ConnectionGuardMode.Off;
builder.Services.AddConnectionsModule(builder.Configuration, appDbConnectionString, connectionGuardOptions);
builder.Services.AddWorkbenchModule(builder.Configuration);
builder.Services.AddPostgreSQLProvider();
// Once, after every project has registered its handlers: logging and validation around each of them.
builder.Services.AddHandlerDecorators();
builder.Services.AddAuth(authOptions, builder.Configuration, builder.Environment, appDbConnectionString);
builder.Services.AddRateLimits(rateLimitingOptions);
builder.Services.AddCaptcha(captchaOptions);

// A year of HTTPS-only. No includeSubDomains or preload: other services on sibling subdomains may still use HTTP,
// and a preload entry is hard to take back.
builder.Services.AddHsts(hsts => hsts.MaxAge = TimeSpan.FromDays(365));

// No CORS: the UI always comes from the API's own origin (production: wwwroot; development: the Vite dev server
// proxies /api and /batchCommandResult), which the SameSite sign-in cookie needs anyway.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

// Created now rather than on the first connection, so a bad ConnectionGuard:Allow entry stops startup
// and the mode in effect is logged.
app.Services.GetRequiredService<IConnectionGuard>();

// Created now, so the log says whether remembered passwords are on.
app.Services.GetRequiredService<ISavedPasswordProtector>();

// Both auth modes use the app database: the accounts' tables first (it creates the file and seeds the admin), then the
// connections module's.
await app.Services.InitializeAppDatabaseAsync();
await app.Services.InitializeConnectionsDatabaseAsync();

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedFor
});

// First, so error responses carry the headers too.
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<ExceptionMiddleware>();
if (authOptions.Mode == AuthMode.None)
{
    app.UseMiddleware<LocalRequestsOnlyMiddleware>();
}

// Separate from the redirect below: behind a TLS-terminating proxy ASPNETCORE_HTTPS_PORT is unset, and HSTS still applies.
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
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
