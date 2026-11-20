using MDBNavigator.Accounts.Email;
using MDBNavigator.Accounts.Identity;
using MDBNavigator.Accounts.Persistence;
using MDBNavigator.SharedKernel.Violations;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace MDBNavigator.Accounts.Demo
{
    // Counts what the server refused each demo guest (IViolationRecorder: the other modules report, this decides). At
    // Demo:ViolationsBeforeBlock in one session, the session ends, the visitor's email is blocked for Demo:BlockHours and
    // the owner gets an email. No IP addresses: a VPN gets around an address block in a minute, and the demo's safety
    // comes from the read-only database and the limits; the block stops casual misuse and tells the owner.
    // Counts are in memory, per session (each session has its own account), so a restart forgets them; blocks are in the
    // database. Only registered with Demo:Enabled.
    public sealed class DemoViolations : IViolationRecorder
    {
        private readonly IServiceScopeFactory _scopes;
        private readonly DemoOptions _options;
        private readonly TimeProvider _time;
        private readonly ILogger<DemoViolations> _logger;
        // One lock for everything: violations are rare and there are only a few guests at once. It also makes sure a
        // session is blocked once, even when two of its violations arrive together.
        private readonly SemaphoreSlim _lock = new(1, 1);
        private readonly Dictionary<Guid, Tally> _tallies = [];

        public DemoViolations(IServiceScopeFactory scopes, DemoOptions options, TimeProvider time, ILogger<DemoViolations> logger)
        {
            _scopes = scopes;
            _options = options;
            _time = time;
            _logger = logger;
        }

        public async Task<bool> RecordAsync(string userId, ViolationKind kind)
        {
            // Auth:Mode None's "local" user is no guest.
            if (!Guid.TryParse(userId, out var id))
            {
                return false;
            }

            await _lock.WaitAsync();
            try
            {
                var now = Now();
                if (!_tallies.TryGetValue(id, out var tally))
                {
                    // Once per account: a user who isn't a guest now never becomes one (each session has a new account).
                    tally = new Tally(await FindActiveSessionVisitorAsync(id, now)) { LastAtUtc = now };
                    _tallies[id] = tally;
                }
                if (tally.VisitorId is not { } visitorId || tally.Ended)
                {
                    return false;
                }

                tally.Counts[(int)kind]++;
                tally.LastAtUtc = now;
                if (tally.Total < _options.ViolationsBeforeBlock)
                {
                    return false;
                }

                // Even if the block below fails: a retry on every further violation would only repeat the failure.
                tally.Ended = true;
                await BlockAsync(id, visitorId, tally, now);
                return true;
            }
            catch (Exception ex)
            {
                // A counting failure must never turn the caller's normal error into a 500.
                _logger.LogError(ex, "Counting a demo violation failed");
                return false;
            }
            finally
            {
                _lock.Release();
            }
        }

        // DemoCleanup: the counts of sessions long over.
        public void Forget(DateTime olderThanUtc)
        {
            _lock.Wait();
            try
            {
                foreach (var (id, tally) in _tallies.Where(t => t.Value.LastAtUtc < olderThanUtc).ToList())
                {
                    _tallies.Remove(id);
                }
            }
            finally
            {
                _lock.Release();
            }
        }

        // Null when the user has no running guest session (a regular account, or a session that is over).
        private async Task<Guid?> FindActiveSessionVisitorAsync(Guid userId, DateTime now)
        {
            await using var scope = _scopes.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<AccountsDbContext>();
            return await db.DemoGuestSessions
                .Where(s => s.UserId == userId && s.EndsAtUtc > now)
                .Select(s => (Guid?)s.VisitorId)
                .FirstOrDefaultAsync();
        }

        // Not cancellable: a guest closing the tab must not stop it.
        private async Task BlockAsync(Guid userId, Guid visitorId, Tally tally, DateTime now)
        {
            try
            {
                await using var scope = _scopes.CreateAsyncScope();
                var db = scope.ServiceProvider.GetRequiredService<AccountsDbContext>();
                DemoVisitor? visitor;

                // The block and the end of every running session of the visitor (two links can make two sessions)
                // together. A session that ends stops its cookie at once (GuestSessionValidator).
                await using (var transaction = await db.Database.BeginTransactionAsync())
                {
                    visitor = await db.DemoVisitors.FirstOrDefaultAsync(v => v.Id == visitorId);
                    if (visitor is not null)
                    {
                        visitor.BlockedUntilUtc = now.AddHours(_options.BlockHours);
                        await db.SaveChangesAsync();
                    }
                    await db.DemoGuestSessions
                        .Where(s => s.VisitorId == visitorId && s.EndsAtUtc > now)
                        .ExecuteUpdateAsync(s => s.SetProperty(x => x.EndsAtUtc, now));
                    await transaction.CommitAsync();
                }

                // This session's account goes now, with its saved and cached connections; the visitor's other sessions,
                // if any, within a minute (DemoCleanup).
                var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
                if (await users.FindByIdAsync(userId.ToString()) is { } user)
                {
                    await scope.ServiceProvider.GetRequiredService<GuestSessions>().DeleteAccountAsync(user, CancellationToken.None);
                }

                // Counts only: no name, email or user id in the log.
                _logger.LogWarning("Demo guest blocked after {Violations} refused actions ({PermissionDenied} permission, {ConnectionRefused} connection, {LimitReached} limit)",
                    tally.Total, tally.Count(ViolationKind.PermissionDenied), tally.Count(ViolationKind.ConnectionRefused), tally.Count(ViolationKind.LimitReached));

                if (visitor is not null)
                {
                    var delivery = scope.ServiceProvider.GetRequiredService<IEmailDelivery>();
                    DemoEmails.SendInBackground(delivery, EmailTemplates.DemoVisitorBlocked(_options.OwnerEmail, visitor.Name, visitor.Email,
                        tally.Count(ViolationKind.PermissionDenied), tally.Count(ViolationKind.ConnectionRefused),
                        tally.Count(ViolationKind.LimitReached), _options.BlockHours), "demo block", _logger);
                }
            }
            catch (Exception ex)
            {
                // The session then runs until its time is up.
                _logger.LogError(ex, "Blocking a demo guest failed");
            }
        }

        private DateTime Now() => _time.GetUtcNow().UtcDateTime;

        private sealed class Tally(Guid? visitorId)
        {
            // Null: not a guest; nothing is counted.
            public Guid? VisitorId { get; } = visitorId;
            public int[] Counts { get; } = new int[Enum.GetValues<ViolationKind>().Length];
            public bool Ended { get; set; }
            public DateTime LastAtUtc { get; set; }

            public int Total => Counts.Sum();

            public int Count(ViolationKind kind) => Counts[(int)kind];
        }
    }
}
