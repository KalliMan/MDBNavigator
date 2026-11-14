using MDBNavigator.API.Filters;
using MDBNavigator.SharedKernel;
using Microsoft.AspNetCore.Mvc;

namespace MDBNavigator.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [RequireSessionId]
    public class BaseApiController : ControllerBase
    {
        // Set by RequireSessionIdAttribute before any action runs.
        protected string SessionId => (string)HttpContext.Items[RequireSessionIdAttribute.ItemKey]!;

        // The user part of the session: the account's id, or "local" with Auth:Mode None. For data kept per user rather
        // than per tab, such as saved connections.
        protected string UserId => SessionKey.UserIdOf(SessionId);
    }
}
