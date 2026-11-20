using MDBNavigator.Accounts.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;

namespace MDBNavigator.Accounts.Demo
{
    // Runs on every request that carries a session cookie. A guest's cookie expires with the session, but a session can
    // also end early (Log out, and later a block), and then the cookie must stop working at once, not when it expires.
    // One indexed lookup, and only for guests.
    internal static class GuestSessionValidator
    {
        public static async Task ValidateAsync(CookieValidatePrincipalContext context)
        {
            if (context.Principal is not { } principal || !GuestSessions.IsGuest(principal))
            {
                return;
            }

            var services = context.HttpContext.RequestServices;
            var now = services.GetRequiredService<TimeProvider>().GetUtcNow().UtcDateTime;
            var db = services.GetRequiredService<AccountsDbContext>();
            if (Guid.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out var userId)
                && await db.DemoGuestSessions.AnyAsync(s => s.UserId == userId && s.EndsAtUtc > now, context.HttpContext.RequestAborted))
            {
                return;
            }

            context.RejectPrincipal();
            await context.HttpContext.SignOutAsync(IdentityConstants.ApplicationScheme);
        }
    }
}
