using Microsoft.AspNetCore.Mvc;

namespace MDBNavigator.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BaseApiController: ControllerBase
    {
        protected string? GetSessionId()
        {
            return Request.Headers["id"];
        }

        protected bool TryGetSessionId(out string sessionId, out IActionResult? errorResult)
        {
            sessionId = Request.Headers["id"];

            if (string.IsNullOrEmpty(sessionId))
            {
                errorResult = BadRequest("The provided request header does not contain ID property.");
                return false;
            }

            errorResult = null;
            return true;
        }
    }
}
