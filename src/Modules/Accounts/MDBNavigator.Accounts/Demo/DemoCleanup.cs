using MDBNavigator.Accounts.Identity;
using MDBNavigator.Accounts.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace MDBNavigator.Accounts.Demo
{
    // Deletes what the demo no longer needs: guest accounts whose session ended (with all their data), old links and
    // session rows, and visitors DemoTerms.VisitorRetentionDays after their last visit. Runs whether or not the demo is on,
    // so switching it off doesn't break the promise in the terms.
    public sealed class DemoCleanup
    {
        private readonly IServiceScopeFactory _scopes;
        private readonly TimeProvider _time;
        private readonly ILogger<DemoCleanup> _logger;
        // The background loop and a test may call it at the same time.
        private readonly SemaphoreSlim _running = new(1, 1);

        public DemoCleanup(IServiceScopeFactory scopes, TimeProvider time, ILogger<DemoCleanup> logger)
        {
            _scopes = scopes;
            _time = time;
            _logger = logger;
        }

        public async Task RunAsync(CancellationToken ct)
        {
            await _running.WaitAsync(ct);
            try
            {
                await using var scope = _scopes.CreateAsyncScope();
                var db = scope.ServiceProvider.GetRequiredService<AccountsDbContext>();
                var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
                var guests = scope.ServiceProvider.GetRequiredService<GuestSessions>();
                var now = _time.GetUtcNow().UtcDateTime;

                // Also a guest without a session row, which shouldn't exist (they are created together).
                var deletedGuests = 0;
                foreach (var user in await users.GetUsersInRoleAsync(RoleNames.Guest))
                {
                    if (!await db.DemoGuestSessions.AnyAsync(s => s.UserId == user.Id && s.EndsAtUtc > now, ct))
                    {
                        await guests.DeleteAccountAsync(user, ct);
                        deletedGuests++;
                    }
                }

                var linksBefore = now.AddDays(-1);
                var links = await db.DemoSignInLinks.Where(l => l.CreatedAtUtc < linksBefore).ExecuteDeleteAsync(ct);
                // Kept a little longer than the 24 hours the sessions per day are counted over.
                var sessionsBefore = now.AddDays(-2);
                var sessions = await db.DemoGuestSessions.Where(s => s.EndsAtUtc < sessionsBefore).ExecuteDeleteAsync(ct);
                var visitorsBefore = now.AddDays(-DemoTerms.VisitorRetentionDays);
                var visitors = await db.DemoVisitors.Where(v => v.LastVisitAtUtc < visitorsBefore).ExecuteDeleteAsync(ct);

                if (deletedGuests + links + sessions + visitors > 0)
                {
                    _logger.LogInformation("Demo clean-up deleted {Guests} guest accounts, {Links} links, {Sessions} session records and {Visitors} visitors",
                        deletedGuests, links, sessions, visitors);
                }
            }
            finally
            {
                _running.Release();
            }
        }
    }

    // DemoCleanup at startup and then every minute: a guest's account is gone within a minute of the session's end.
    internal sealed class DemoCleanupService : BackgroundService
    {
        private static readonly TimeSpan Interval = TimeSpan.FromMinutes(1);

        private readonly DemoCleanup _cleanup;
        private readonly TimeProvider _time;
        private readonly ILogger<DemoCleanupService> _logger;

        public DemoCleanupService(DemoCleanup cleanup, TimeProvider time, ILogger<DemoCleanupService> logger)
        {
            _cleanup = cleanup;
            _time = time;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            using var timer = new PeriodicTimer(Interval, _time);
            try
            {
                do
                {
                    try
                    {
                        await _cleanup.RunAsync(stoppingToken);
                    }
                    catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
                    {
                        // Tried again in a minute.
                        _logger.LogError(ex, "Demo clean-up failed");
                    }
                }
                while (await timer.WaitForNextTickAsync(stoppingToken));
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                // Shutting down.
            }
        }
    }
}
