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

builder.Services.AddCors(opt =>
{
    opt.AddPolicy("CorsPolicy", policy =>
    {
        policy
            .WithOrigins("http://localhost:3000", "http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

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
app.UseCors("CorsPolicy");

if (builder.Configuration.GetValue<string>("ASPNETCORE_HTTPS_PORT") != null)
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
