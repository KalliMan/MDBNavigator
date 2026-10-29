using MDBNavigator.API.Core;
using System.Net;

namespace MDBNavigator.API.Middleware
{
    // Auth:Mode = None has no sign-in, so anyone who could reach the API could use it. Only requests from this
    // machine are served.
    public class LocalRequestsOnlyMiddleware
    {
        private readonly RequestDelegate _next;

        public LocalRequestsOnlyMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var remote = context.Connection.RemoteIpAddress;
            if (remote is not null && IPAddress.IsLoopback(remote.IsIPv4MappedToIPv6 ? remote.MapToIPv4() : remote))
            {
                await _next(context);
                return;
            }

            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsJsonAsync(new ErrorResponse(StatusCodes.Status403Forbidden,
                "This server runs without sign-in (Auth:Mode = None) and accepts requests only from the local machine."));
        }
    }
}
