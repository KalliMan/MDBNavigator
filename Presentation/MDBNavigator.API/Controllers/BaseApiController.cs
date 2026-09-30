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
            errorResult = null;
            var id = GetSessionId();

            if (string.IsNullOrEmpty(id))
            {
                sessionId = string.Empty;
                errorResult = BadRequest("The provided request header does not contain ID property.");
                return false;
            }

            sessionId = id;
            return true;
        }
    }
}
