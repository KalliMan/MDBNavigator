using MDBNavigator.API.Extensions;
using MDBNavigator.API.SignalR;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddApplicationServices(builder.Configuration);

builder.Services.AddControllers();

var app = builder.Build();

app.UseCors("CorsPolicy");

// Configure the HTTP request pipeline.

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapHub<BatchCommandResultHub>("/batchCommandResult");

//app.UseEndpoints(endpoints => {
//    endpoints.MapControllers();
//    endpoints.MapHub<MessageHub>("/offers");
//});
app.UseSession();
app.MapControllers();

app.Run();
