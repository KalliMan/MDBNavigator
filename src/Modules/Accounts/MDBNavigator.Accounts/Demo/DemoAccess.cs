using MDBNavigator.Accounts.Email;
using MDBNavigator.Accounts.Identity;
using MDBNavigator.Accounts.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Buffers.Text;
using System.Security.Cryptography;
using System.Text;

namespace MDBNavigator.Accounts.Demo
{
    public enum DemoStartOutcome
    {
        Started,
        // Unknown, used, or expired.
        LinkInvalid,
        VisitorDailyLimit,
        Full,
        AddressLimit
    }

    public record DemoStartResult(DemoStartOutcome Outcome, DateTime? EndsAtUtc = null);

    // How invited people get into the demo: a link by email, then a short session in a throwaway account.
    // Only registered with Demo:Enabled. Names and emails never go into the log.
    public class DemoAccess
    {
        private readonly AccountsDbContext _db;
        private readonly UserManager<ApplicationUser> _users;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly ILookupNormalizer _normalizer;
        private readonly IEmailDelivery _delivery;
        private readonly EmailOptions _email;
        private readonly DemoOptions _options;
        private readonly GuestStartGate _gate;
        private readonly TimeProvider _time;
        private readonly ILogger<DemoAccess> _logger;

        public DemoAccess(AccountsDbContext db, UserManager<ApplicationUser> users, SignInManager<ApplicationUser> signInManager,
            ILookupNormalizer normalizer, IEmailDelivery delivery, EmailOptions email, DemoOptions options, GuestStartGate gate,
            TimeProvider time, ILogger<DemoAccess> logger)
        {
            _db = db;
            _users = users;
            _signInManager = signInManager;
            _normalizer = normalizer;
            _delivery = delivery;
            _email = email;
            _options = options;
            _gate = gate;
            _time = time;
            _logger = logger;
        }

        // The invite form. The name and the terms wait in the link until it is used: only then is the email proven, and
        // only then is the visitor created (or, for someone already known, updated).
        public Task RequestJoinLinkAsync(string name, string email, CancellationToken ct)
            => RequestLinkAsync(email, name, ct);

        // A returning visitor. An unknown address gets the same answer and no email: the answer must not tell who has
        // visited the demo.
        public async Task RequestSignInLinkAsync(string email, CancellationToken ct)
        {
            var normalized = _normalizer.NormalizeEmail(email);
            if (!await _db.DemoVisitors.AnyAsync(v => v.NormalizedEmail == normalized, ct))
            {
                _logger.LogInformation("Demo sign-in link asked for an address that has no visitor; nothing sent");
                return;
            }
            await RequestLinkAsync(email, name: null, ct);
        }

        // ipAddress: where the request came from, for SessionsPerIpPerHour.
        public async Task<DemoStartResult> StartAsync(string token, string ipAddress, CancellationToken ct)
        {
            var tokenHash = Hash(token);

            // One start at a time: the counts below stay true until this session is in the database.
            using var gate = await _gate.EnterAsync(ct);
            var now = Now();

            var link = await _db.DemoSignInLinks.FirstOrDefaultAsync(l => l.TokenHash == tokenHash, ct);
            if (link is null || link.UsedAtUtc is not null || link.ExpiresAtUtc <= now)
            {
                return new DemoStartResult(DemoStartOutcome.LinkInvalid);
            }

            var visitor = await _db.DemoVisitors.FirstOrDefaultAsync(v => v.NormalizedEmail == link.NormalizedEmail, ct);
            if (visitor is null && link.Name is null)
            {
                // A returning visitor's link, but the visitor was deleted meanwhile.
                return new DemoStartResult(DemoStartOutcome.LinkInvalid);
            }

            // The limits come before the link is used up: a visitor told "the demo is full" can try the same link again.
            if (visitor is not null)
            {
                var since = now.AddDays(-1);
                var sessionsToday = await _db.DemoGuestSessions.CountAsync(s => s.VisitorId == visitor.Id && s.StartedAtUtc > since, ct);
                if (sessionsToday >= _options.SessionsPerVisitorPerDay)
                {
                    return new DemoStartResult(DemoStartOutcome.VisitorDailyLimit);
                }
            }
            var activeGuests = await _db.DemoGuestSessions.CountAsync(s => s.EndsAtUtc > now, ct);
            if (activeGuests >= _options.MaxActiveGuests)
            {
                _logger.LogWarning("Demo full: {ActiveGuests} guests at once", activeGuests);
                return new DemoStartResult(DemoStartOutcome.Full);
            }
            if (!_gate.AddressAllowed(ipAddress, now, _options.SessionsPerIpPerHour))
            {
                _logger.LogWarning("Demo session refused: too many sessions from one address within the hour");
                return new DemoStartResult(DemoStartOutcome.AddressLimit);
            }

            var newVisitor = visitor is null;
            var endsAt = now.AddMinutes(_options.SessionMinutes);
            ApplicationUser guest;

            // The visitor, the used link, the account, its role and the session row together, or none of them: an account
            // without its session row would be a guest without an end.
            await using (var transaction = await _db.Database.BeginTransactionAsync(ct))
            {
                visitor ??= _db.DemoVisitors.Add(new DemoVisitor
                {
                    Name = link.Name!,
                    Email = link.Email,
                    NormalizedEmail = link.NormalizedEmail,
                    TermsVersion = link.TermsVersion,
                    CreatedAtUtc = now
                }).Entity;
                if (link.Name is not null)
                {
                    visitor.Name = link.Name;
                }
                visitor.Email = link.Email;
                visitor.TermsVersion = link.TermsVersion;
                visitor.TermsAcceptedAtUtc = link.CreatedAtUtc;
                visitor.LastVisitAtUtc = now;
                visitor.VisitCount++;
                link.UsedAtUtc = now;

                // No password and an address that can't receive mail (.invalid is reserved): the account can't be signed
                // in to any other way, and password reset can't reach it.
                guest = new ApplicationUser();
                guest.UserName = $"guest-{guest.Id:N}";
                guest.Email = $"guest-{guest.Id:N}@guest.invalid";
                guest.EmailConfirmed = true;
                ThrowIfFailed(await _users.CreateAsync(guest), "Creating a demo guest account");
                ThrowIfFailed(await _users.AddToRoleAsync(guest, RoleNames.Guest), "Making the account a demo guest");

                _db.DemoGuestSessions.Add(new DemoGuestSession
                {
                    VisitorId = visitor.Id,
                    UserId = guest.Id,
                    StartedAtUtc = now,
                    EndsAtUtc = endsAt
                });
                await _db.SaveChangesAsync(ct);
                await transaction.CommitAsync(ct);
            }
            _gate.RecordStart(ipAddress, now);

            // The cookie ends with the session and is never renewed. GuestSessionValidator also ends it early when needed.
            await _signInManager.SignInAsync(guest, new AuthenticationProperties
            {
                IsPersistent = true,
                ExpiresUtc = new DateTimeOffset(endsAt, TimeSpan.Zero),
                AllowRefresh = false
            });

            _logger.LogInformation("Demo session started ({ActiveGuests} of {MaxActiveGuests} guests)", activeGuests + 1, _options.MaxActiveGuests);
            if (newVisitor)
            {
                _logger.LogInformation("New demo visitor");
                SendInBackground(EmailTemplates.NewDemoVisitor(_options.OwnerEmail, visitor.Name, visitor.Email), "new demo visitor");
            }

            return new DemoStartResult(DemoStartOutcome.Started, endsAt);
        }

        private async Task RequestLinkAsync(string email, string? name, CancellationToken ct)
        {
            var now = Now();
            var normalized = _normalizer.NormalizeEmail(email);

            var since = now.AddHours(-1);
            var linksThisHour = await _db.DemoSignInLinks.CountAsync(l => l.NormalizedEmail == normalized && l.CreatedAtUtc > since, ct);
            if (linksThisHour >= _options.LinkEmailsPerAddressPerHour)
            {
                _logger.LogWarning("Demo link not sent: the address already had {LinkCount} links within the hour", linksThisHour);
                return;
            }

            // 256 random bits; only the hash is stored.
            var token = Base64Url.EncodeToString(RandomNumberGenerator.GetBytes(32));
            _db.DemoSignInLinks.Add(new DemoSignInLink
            {
                TokenHash = Hash(token),
                Email = email,
                NormalizedEmail = normalized,
                Name = name,
                TermsVersion = DemoTerms.Version,
                CreatedAtUtc = now,
                ExpiresAtUtc = now.AddMinutes(_options.LinkValidMinutes)
            });
            await _db.SaveChangesAsync(ct);

            var link = QueryHelpers.AddQueryString($"{_email.AppBaseUrl.TrimEnd('/')}/demo/start", "token", token);
            SendInBackground(EmailTemplates.DemoLink(email, link, _options.LinkValidMinutes, _options.SessionMinutes), "demo link");
        }

        // Sent after the answer, so a request that sends an email takes as long as one that doesn't (an unknown returning
        // visitor, an address over its limit): the timing must not tell who has visited. A failure is logged, without the
        // recipient; the visitor can ask again.
        private void SendInBackground(EmailMessage message, string kind)
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    await _delivery.SendAsync(message, CancellationToken.None);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Sending the {EmailKind} email failed", kind);
                }
            });
        }

        private DateTime Now() => _time.GetUtcNow().UtcDateTime;

        private static string Hash(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

        // Error codes only: Identity's descriptions can contain the email.
        private static void ThrowIfFailed(IdentityResult result, string action)
        {
            if (!result.Succeeded)
            {
                throw new InvalidOperationException($"{action} failed: {string.Join(", ", result.Errors.Select(e => e.Code))}");
            }
        }
    }
}
