using MDBNavigator.Application;
using MDBNavigator.Application.Common;
using MDBNavigator.API.Auth;
using MDBNavigator.API.Middleware;
using MDBNavigator.Infrastructure;
using MDBNavigator.Infrastructure.Accounts;
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
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices();
builder.Services.AddPostgreSQLProvider();
builder.Services.AddAuth(authOptions, builder.Configuration, builder.Environment);

// No CORS: the UI always comes from the API's own origin (production: wwwroot; development: the Vite dev server
// proxies /api and /batchCommandResult), which the SameSite sign-in cookie needs anyway.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

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
app.MapAuthEndpoints(authOptions);

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
