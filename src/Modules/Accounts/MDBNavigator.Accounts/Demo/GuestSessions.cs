using MDBNavigator.Accounts.Identity;
using MDBNavigator.Accounts.Persistence;
using MDBNavigator.SharedKernel.UserData;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace MDBNavigator.Accounts.Demo
{
    // Name: the visitor's, for the top bar (a guest account's own email is made up).
    public record GuestInfo(string Name, DateTime EndsAtUtc);

    // A signed-in demo guest's session: what the UI shows, and ending it. Registered whether or not the demo is on, so
    // guests left over from when it was on are still ended and deleted.
    public class GuestSessions
    {
        private readonly AccountsDbContext _db;
        private readonly UserManager<ApplicationUser> _users;
        private readonly IEnumerable<IUserDataEraser> _erasers;
        private readonly TimeProvider _time;

        public GuestSessions(AccountsDbContext db, UserManager<ApplicationUser> users, IEnumerable<IUserDataEraser> erasers, TimeProvider time)
        {
            _db = db;
            _users = users;
            _erasers = erasers;
            _time = time;
        }

        // From the role claim in the session cookie, without a database call.
        public static bool IsGuest(ClaimsPrincipal principal) => principal.IsInRole(RoleNames.Guest);

        // Null when the session has ended (or the principal is no guest).
        public async Task<GuestInfo?> GetAsync(ClaimsPrincipal principal, CancellationToken ct)
        {
            if (!TryGetUserId(principal, out var userId))
            {
                return null;
            }

            var now = _time.GetUtcNow().UtcDateTime;
            var session = await _db.DemoGuestSessions
                .Where(s => s.UserId == userId && s.EndsAtUtc > now)
                .Join(_db.DemoVisitors, s => s.VisitorId, v => v.Id, (s, v) => new { v.Name, s.EndsAtUtc })
                .FirstOrDefaultAsync(ct);
            // SQLite gives the time back without its kind; as UTC it goes out with a "Z", which the browser needs to read
            // it as UTC rather than its own local time.
            return session is null ? null : new GuestInfo(session.Name, DateTime.SpecifyKind(session.EndsAtUtc, DateTimeKind.Utc));
        }

        // Log out: the session ends now, which frees its place at once, and the account goes with everything it had.
        public async Task EndAsync(ClaimsPrincipal principal, CancellationToken ct)
        {
            if (!TryGetUserId(principal, out var userId))
            {
                return;
            }

            var now = _time.GetUtcNow().UtcDateTime;
            await _db.DemoGuestSessions
                .Where(s => s.UserId == userId && s.EndsAtUtc > now)
                .ExecuteUpdateAsync(s => s.SetProperty(x => x.EndsAtUtc, now), ct);

            if (await _users.FindByIdAsync(userId.ToString()) is { } user)
            {
                await DeleteAccountAsync(user, ct);
            }
        }

        // Like deleting an account from the account page: each module first removes what it keeps about the user
        // (saved connections, cached credentials, running queries), then the account goes.
        internal async Task DeleteAccountAsync(ApplicationUser user, CancellationToken ct)
        {
            var userId = user.Id.ToString();
            foreach (var eraser in _erasers)
            {
                await eraser.EraseAsync(userId, ct);
            }

            var result = await _users.DeleteAsync(user);
            if (!result.Succeeded)
            {
                throw new InvalidOperationException($"Deleting a demo guest account failed: {string.Join(", ", result.Errors.Select(e => e.Code))}");
            }
        }

        private bool TryGetUserId(ClaimsPrincipal principal, out Guid userId)
        {
            userId = Guid.Empty;
            return IsGuest(principal) && Guid.TryParse(_users.GetUserId(principal), out userId);
        }
    }
}
