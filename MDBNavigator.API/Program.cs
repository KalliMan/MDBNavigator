using MDBNavigator.Application;
using MDBNavigator.Application.Common;
using MDBNavigator.API.Middleware;
using MDBNavigator.Infrastructure;
using MDBNavigator.Infrastructure.Connection;
using MDBNavigator.Infrastructure.PostgreSQL;
using MDBNavigator.Infrastructure.SignalR;
using Microsoft.AspNetCore.HttpOverrides;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton(
    builder.Configuration.GetSection(QueryExecutionOptions.SectionName).Get<QueryExecutionOptions>() ?? new QueryExecutionOptions());
builder.Services.AddSingleton(
    builder.Configuration.GetSection(ConnectionCacheOptions.SectionName).Get<ConnectionCacheOptions>() ?? new ConnectionCacheOptions());
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices();
builder.Services.AddPostgreSQLProvider();

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
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedFor
});

app.UseMiddleware<ExceptionMiddleware>();
app.UseCors("CorsPolicy");

if (builder.Configuration.GetValue<string>("ASPNETCORE_HTTPS_PORT") != null)
{
    app.UseHttpsRedirection();
}

app.MapHub<BatchCommandResultHub>("/batchCommandResult");

// The built UI is in wwwroot only when it was built into it (the Dockerfile does that). In development the UI
// runs on the Vite dev server, so there is nothing to serve; skipping this avoids the "WebRootPath was not found" warnings.
var serveUi = Directory.Exists(app.Environment.WebRootPath)
    && File.Exists(Path.Combine(app.Environment.WebRootPath, "index.html"));
if (serveUi)
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
}

app.MapControllers();
if (serveUi)
{
    // Client-side routes (anything that is not an API/hub endpoint or a file) get the SPA.
    app.MapFallbackToFile("index.html");
}

app.Run();

