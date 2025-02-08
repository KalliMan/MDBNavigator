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
    }
}
