using MDBNavigator.API.Filters;
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
    }
}
