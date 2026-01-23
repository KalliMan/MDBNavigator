using MDBNavigator.API.Extensions;
using MDBNavigator.API.Middleware;
using MDBNavigator.API.SignalRHub;
using Microsoft.AspNetCore.HttpOverrides;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddApplicationServices(builder.Configuration);

builder.Services.AddControllers();

var app = builder.Build();
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedFor
});

app.UseMiddleware<ExceptionMiddleware>();
app.UseCors("CorsPolicy");

// optional: only use HTTPS redirection when HTTPS port is known
if (builder.Configuration.GetValue<string>("ASPNETCORE_HTTPS_PORT") != null)
{
    app.UseHttpsRedirection();
}

app.MapHub<BatchCommandResultHub>("/batchCommandResult");
app.UseDefaultFiles();   // enables serving index.html at /
app.UseStaticFiles();    // serves wwwroot filesok. 

app.MapControllers();
app.MapFallbackToFile("index.html"); // SPA routing fallback


app.Run();
