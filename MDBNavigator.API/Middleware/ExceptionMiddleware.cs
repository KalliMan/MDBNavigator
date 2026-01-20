using FluentValidation;
using MDBNavigator.API.Core;
using MDBNavigator.BL.Exceptions;
using System.Net;
using System.Text.Json;

namespace MDBNavigator.API.Middleware
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionMiddleware> _logger;
        private readonly IHostEnvironment _env;

        public ExceptionMiddleware(RequestDelegate next,
            ILogger<ExceptionMiddleware> logger,
            IHostEnvironment env)
        {
            _next = next;
            _logger = logger;
            _env = env;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {

                context.Response.ContentType = "application/json";

                int statusCode;
                string message;

                switch (ex)
                {
                    case NotConnectedException:
                    case NotSupportedException:
                    case ValidationException:                        
                        statusCode = (int)HttpStatusCode.BadRequest;
                        message = ex.Message;
                        break;
                    default:
                        statusCode = (int)HttpStatusCode.InternalServerError;
                        message = ex.Message;
                        break;
                }

                context.Response.StatusCode = statusCode;

                var response = _env.IsDevelopment()
                    ? new AppException(statusCode, message, ex.StackTrace?.ToString() ?? string.Empty)
                    : new AppException(statusCode, message);

                var options = new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                };

                var json = JsonSerializer.Serialize(response, options);
                await context.Response.WriteAsync(json);
            }
        }
    }
}
