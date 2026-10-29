using MDBNavigator.API.Core;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace MDBNavigator.API.Filters
{
    // Every API call carries the client's session (browser tab) id in the "id" header. This filter rejects
    // calls without it and stores it for BaseApiController.SessionId, so actions don't repeat the check.
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

            context.HttpContext.Items[ItemKey] = values[0];
        }
    }
}
