# Authentication

How signing in works in MDBNavigator. This covers roadmap steps 0.1a–0.1e. Connection guardrails and other limits are 0.2.

## Goals

- A public or shared instance can't be used by anyone who isn't signed in.
- One person running it on their own machine doesn't need an account at all.
- A company hosting it for a team decides who gets an account.
- Database connections and running queries belong to one user and one browser tab, and nobody else can see them.

## Approach

ASP.NET Core Identity with its built-in API endpoints, accounts stored in the app's own SQLite database, and an HttpOnly session cookie. The browser talks to a single origin: in production the API serves the UI, and in development the Vite dev server proxies `/api` and `/batchCommandResult` to the API. No tokens are kept in JavaScript.

Identity's database storage uses EF Core, but only for the app's own data. Browsing user databases stays on Dapper.

## Storage

The app database is a single SQLite file, `data/mdbnavigator.db` under the app's folder by default. It needs no database server, and it will also hold the app's other per-user data later (preferences, saved queries, history). It runs in WAL mode.

- **The file must be on a persistent local disk.** In Docker, the `data` folder is a mounted volume; without one, the data is lost when the container is recreated. Network file shares (SMB, NFS) are not safe for SQLite.
- **Protect the file like a secret.** It holds password hashes and the Data Protection keys, which are stored unencrypted: anyone with the file could forge sign-in cookies. Encrypting the keys (with a certificate) is a later option.
- **Backups** use SQLite's own copy (`VACUUM INTO 'backup.db'`) or a short app stop, never a plain file copy while the app is writing.
- **One app instance** per database file.
- **A database server later:** the code uses EF Core only, with no SQLite-specific SQL outside startup. Ids are GUIDs, times are UTC, and table names are snake_case. Migrations live in a per-database folder (`Migrations/Sqlite`). Adding PostgreSQL means adding a second migrations set and a setting to choose it.

## Settings

| Setting | Values | Meaning |
|---|---|---|
| `Auth:Mode` | `Accounts` (default), `None` | `None`: no sign-in, and the API accepts requests only from the local machine. |
| `Auth:SignUp` | `Open` (default), `Closed` | `Closed`: nobody can create an account through the UI or the API. |
| `Auth:Admin:Email`, `Auth:Admin:Password` | | The first admin, created at startup if no admin exists. Needed with `SignUp = Closed`. |
| `ConnectionStrings:AppDb` | | The app database. Default: `Data Source=data/mdbnavigator.db`. A relative path is taken from the app's folder. Not used with `Auth:Mode = None`. |
| `RateLimiting:AuthRequestsPerMinute` | default `10` | Requests per minute and IP address to the sign-in, register, password and email endpoints. |
| `Authentication:{Google\|Microsoft\|GitHub}:ClientId`, `ClientSecret` | | Each provider is switched on only when both values are set. The provider's app must allow the return address `https://{host}/api/auth/signin-google` (or `-microsoft`, `-github`). |
| `Email:*` (SMTP) | | Email confirmation and password reset are on only when SMTP is configured. |

## Server

- **Endpoints** under `/api/auth`: Identity's built-in endpoints (`login`, `confirmEmail`, `resendConfirmationEmail`, `forgotPassword`, `resetPassword`, `manage/info`), plus Identity's `register` behind a check of `Auth:SignUp`, and our own `settings` (anonymous: mode, sign-up and the configured providers), `logout`, `me`, `external/{provider}` and `external/callback`.
- **Bearer tokens:** Identity's login can also return a bearer token (`useCookies=false`), for API clients and tools such as `MDBNavigator.API.http`. The UI uses only the cookie.
- **Session cookie:** `mdbnav_session`, HttpOnly, `Secure` outside development, `SameSite=Lax`, with a 14-day sliding expiry. Lax still keeps the cookie off cross-site POST requests, and it lets the social-login redirect back from the provider work. Our GET requests don't change anything.
- **Passwords:** at least 10 characters, with no rules about digits or symbols. Length matters more than composition, as current NIST guidance says.
- **Lockout:** 5 failed attempts lock the account for 5 minutes. The sign-in, register, password and email endpoints are rate limited per IP address. `me`, `settings` and `logout` are not, because the UI calls them on every load.
- **Social login:** the browser goes to `/api/auth/external/{provider}?returnTo=…`, then to the provider, and back through `/api/auth/external/callback`, which redirects into the app or to `/login?error=…`. `returnTo` must be a path on this site; anything else becomes `/`.
  - **Linking to an existing account** (same email) happens only when **the provider verified the email and the account has confirmed it**. Otherwise someone could register the address first, with a password or through a provider that doesn't verify emails, and end up sharing the real owner's account. In that case the user signs in with the password and links the provider from the account page (0.1e).
  - **Which providers verify:** Google says so per login (`verified_email`). GitHub returns only verified addresses (with the `user:email` scope, also a private primary one). Microsoft is treated as unverified, because work accounts can carry an address their organization never checked.
  - **A new account** through a provider has its email confirmed only when the provider verified it. With `Auth:SignUp = Closed`, no new accounts are created this way; existing ones can still sign in.
  - **Error codes** for the sign-in page: `external-cancelled`, `external-failed`, `external-no-email`, `external-email-in-use`, `external-locked-out`, `external-sign-up-closed`.
- **Email confirmation** is required only when SMTP is configured. Without SMTP, accounts work right away, and an admin resets passwords.
- **Sessions:** the session id becomes `userId:tabId`. The tab id still comes from the `id` header. The SignalR hub requires sign-in and puts each connection in the group of its own `userId:tabId`. It no longer trusts the `applicationId` query string.
- **Data Protection keys** are stored in the app database, so cookies stay valid across restarts and containers.
- **Migrations** run at startup.
- **`Auth:Mode = None`** registers no Identity and needs no app database. Every request must come from the local machine, and all of them act as one user, `local`.
- **Development** uses `Auth:Mode = None` until the sign-in screens exist (0.1d), so the current UI keeps working.
- **Roles:** `Admin` exists from the start. In Phase 0 it has no extra screens; user management comes with the team edition.

## UI

### Opening the app

1. The app asks `GET /api/auth/me`. A short loading state shows meanwhile.
2. Not signed in: the sign-in page.
3. Signed in: the workspace, as today. The connect dialog opens if there are no connections yet.

With `Auth:Mode = None` there is no sign-in page, and a "Local mode" label takes the place of the user menu.

### Pages

Pages use `react-router`. Email links and the social-login return need real addresses.

| Path | Page | Shown when |
|---|---|---|
| `/login` | Sign in: provider buttons, then email and password, "Forgot password?", "Create one" | Always (in `Accounts` mode). `?error=` shows the social-login error. |
| `/register` | Create account: provider buttons, then email, password and password rules | `SignUp = Open` |
| `/check-inbox` | "We sent a link to …", with "Send again" | After registering, when SMTP is configured |
| `/confirm-email` | "Your email is confirmed", with "Sign in" | From the email link |
| `/forgot-password` | Email field. The answer never reveals whether an account exists. | SMTP configured |
| `/reset-password` | New password | From the email link |
| `/account` | Change or set password, linked providers, delete account | Signed in (step 0.1e) |
| `/` | The workspace | Signed in, or `Auth:Mode = None` |

Only the providers that are configured get a button. The pages use the current look (Tailwind and the existing `Button` and `Input` components). The UI refresh in Phase 1 restyles them with the rest of the app.

### Top bar

The workspace gets a slim top bar: the app name on the left, the user menu on the right (email, how you signed in, Log out). The UI refresh will add more to it later: a connect button, the dark mode switch, help.

### Edge cases

- **Session expired:** any 401 sends the app to `/login`, and it returns to the workspace afterwards. Database connections survive, because the server keys them by `userId:tabId`, which hasn't changed. Unsaved SQL in editor tabs is lost; saving drafts comes with query history in Phase 1.
- **Log out:** reloads the page into `/login`, which clears every tab, result and connection from memory.
- **Another user signs in on the same tab:** their `userId` differs, so they get "Not connected" instead of the previous user's connections.
- **Result stream:** the hub checks the sign-in when it connects. If it can't reconnect because of a 401, the app treats that as signed out.
- **Account deleted:** the user's cached connections are removed, and their running queries are cancelled.
- **Users who signed up through a provider** have no password. The account page offers "Set password" instead of "Change password".

## Open questions

- **0.1c: confirmed email and provider accounts.** Accounts created through Microsoft have an unconfirmed email. Once email confirmation is required (SMTP configured), it must apply to password sign-in only, or those accounts couldn't sign in.
- **0.1d: the dev proxy and the return address.** The provider return address is built from the request. The Vite proxy must keep the browser's host (`changeOrigin: false`) and the scheme must match, either by proxying to the API's HTTP port or by forwarding `X-Forwarded-Proto`. Otherwise the provider rejects the return address.

- **`Auth:Mode = None` inside Docker.** Requests reach the container from the Docker network, not from loopback, so the local-machine check would reject them. Decide in 0.4 whether `None` is allowed there, and how.
- **Getting into the public demo** without a sign-up wall (0.5b).
- **Two-factor authentication.** Identity supports it, but it's not planned for Phase 0.
