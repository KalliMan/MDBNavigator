using FluentValidation;
using MDBNavigator.API.Core;
using MDBNavigator.Application.Contracts;
using MDBNavigator.Domain.Exceptions;
using System.Data.Common;
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
            catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
            {
                // The client went away (tab closed, request aborted) and its CancellationToken stopped the work.
                // Nobody is left to receive a response, so this is not an error.
                _logger.LogDebug("Request {Method} {Path} was aborted by the client", context.Request.Method, context.Request.Path);
            }
            catch (Exception ex)
            {
                var (statusCode, message) = MapException(ex, context.RequestServices.GetService<IDatabaseErrorDescriber>());

                if (statusCode >= 500)
                {
                    _logger.LogError(ex, "Unhandled exception for {Method} {Path}", context.Request.Method, context.Request.Path);
                }
                else
                {
                    _logger.LogWarning("Request {Method} {Path} failed with {StatusCode}: {Message}",
                        context.Request.Method, context.Request.Path, statusCode, ex.Message);
                }

                // Part of the response is already sent: it can't be replaced by an error body.
                if (context.Response.HasStarted)
                {
                    throw;
                }

                context.Response.ContentType = "application/json";
                context.Response.StatusCode = statusCode;

                var response = _env.IsDevelopment()
                    ? new ErrorResponse(statusCode, message, ex.StackTrace?.ToString() ?? string.Empty)
                    : new ErrorResponse(statusCode, message);

                var options = new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                };

                var json = JsonSerializer.Serialize(response, options);
                await context.Response.WriteAsync(json);
            }
        }

        // Errors caused by the request or the database (bad input, failed connection, SQL error) are 4xx
        // with their message; anything else is a bug: 500, with details only in Development.
        private (int StatusCode, string Message) MapException(Exception ex, IDatabaseErrorDescriber? errorDescriber) => ex switch
        {
            ObjectNotFoundException => ((int)HttpStatusCode.NotFound, ex.Message),
            DbException => ((int)HttpStatusCode.BadRequest, errorDescriber?.Describe(ex) ?? ex.Message),
            ValidationException
                or NotConnectedException
                or ConnectionFailedException
                or NotSupportedException
                or ArgumentException => ((int)HttpStatusCode.BadRequest, ex.Message),
            _ => ((int)HttpStatusCode.InternalServerError,
                _env.IsDevelopment() ? ex.Message : "An unexpected error occurred.")
        };
    }
}
