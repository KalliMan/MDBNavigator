using MDBNavigator.API.Extensions;
using MDBNavigator.API.Middleware;
using MDBNavigator.API.SignalRHub;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddApplicationServices(builder.Configuration);

builder.Services.AddControllers();

var app = builder.Build();

app.UseMiddleware<ExceptionMiddleware>();
app.UseCors("CorsPolicy");

// Configure the HTTP request pipeline.

app.UseHttpsRedirection();
app.UseAuthorization();

// -> needed for production
//app.UseDefaultFiles();
//app.UseStaticFiles();
//app.MapFallbackToController("Index", "Fallback");

app.MapHub<BatchCommandResultHub>("/batchCommandResult");

app.UseSession();
app.MapControllers();

app.Run();
