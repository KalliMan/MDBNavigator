using MDBNavigator.API.Core;
using MDBNavigator.Application.Common;
using MDBNavigator.Infrastructure.Accounts;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;

namespace MDBNavigator.API.Filters
{
    // Every API call carries the client's tab id in the "id" header. This filter rejects calls without it and stores
    // the session ("{userId}:{tabId}", see SessionKey) for BaseApiController.SessionId, so actions don't repeat the check.
    public class RequireSessionIdAttribute : ActionFilterAttribute
    {
        public const string HeaderName = "id";
        internal const string ItemKey = "MDBNavigator.SessionId";

        public override void OnActionExecuting(ActionExecutingContext context)
        {
            var values = context.HttpContext.Request.Headers[HeaderName];
            if (values.Count != 1 || string.IsNullOrWhiteSpace(values[0]))
            {
                context.Result = new BadRequestObjectResult(
                    new ErrorResponse(StatusCodes.Status400BadRequest, $"The request must contain exactly one '{HeaderName}' header."));
                return;
            }

            var userId = GetUserId(context.HttpContext);
            if (userId is null)
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            context.HttpContext.Items[ItemKey] = SessionKey.Create(userId, values[0]!);
        }

        // The signed-in account, or the local user when Auth:Mode = None. Null only if a controller was left
        // reachable without sign-in by mistake.
        private static string? GetUserId(HttpContext http)
        {
            if (http.User.Identity?.IsAuthenticated == true)
            {
                return http.User.FindFirstValue(ClaimTypes.NameIdentifier);
            }

            return http.RequestServices.GetRequiredService<AuthOptions>().Mode == AuthMode.None
                ? SessionKey.LocalUserId
                : null;
        }
    }
}
