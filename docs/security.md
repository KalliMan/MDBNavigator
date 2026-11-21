# Security

How MDBNavigator protects an instance that strangers can use: which databases they may reach, how much they may do, and how credentials are kept. Sign-in itself is designed in [specs/authentication.md](specs/authentication.md). The settings named here are listed in the README's [Configuration](../README.md#configuration).

- [Connection guardrails](#connection-guardrails)
- [Rate limits and CAPTCHA](#rate-limits-and-captcha)
- [Security headers](#security-headers)
- [Connection credentials](#connection-credentials)
- [Remembered passwords](#remembered-passwords)
- [Public demo](#public-demo)

## Connection guardrails

The server opens database connections itself, so on an instance where strangers can sign up, a user could otherwise reach the server's own network: databases on `localhost` or a private range that are safe only because nothing outside can reach them, and cloud metadata services that hand out the server's cloud credentials. A user can't reach their own private network through someone else's server anyway, so blocking it takes nothing away from them.

| Mode | Allows |
|---|---|
| `Public` | Public internet addresses, plus `Allow` entries. The default with open sign-up. |
| `AllowList` | Only `Allow` entries, for example "only our three database servers". |
| `Off` | Any address. The default without accounts (only the local machine is served) and with closed sign-up (an admin decides who gets in). |

- Cloud metadata addresses (`169.254.169.254`, `fd00:ec2::254` and a few others) are refused in every mode, even if an `Allow` entry covers them.
- The host is resolved once and every address it resolves to is checked; the connection then goes to a checked address, so a DNS answer can't change between the check and the connection. IPv6 forms that carry an IPv4 address (`::ffff:10.0.0.1`) are judged by that address.
- A host name `Allow` entry matches what the user typed and allows whatever it resolves to. Ranges and addresses match the resolved address.
- The host must be a host name or an IP address. Unix socket paths, host lists (`a,b`) and `host:port` are refused; the port has its own field.
- An invalid `Allow` entry stops the app at startup, and the mode in effect is logged.
- In Docker, `localhost` is the container itself: allow the database's service name or `host.docker.internal` instead.

## Rate limits and CAPTCHA

The server opens database connections and runs queries for its users, so without limits one user could use it to guess database passwords, scan hosts and ports, or keep every query worker busy. A refused request gets `429` with a message and, where the wait is known, a `Retry-After` header. Every `RateLimiting` value can be set to `0` to switch that limit off.

- **Per user:** the limits count per signed-in user, so people behind one shared address (an office, a VPN) don't share them. Sign-in requests count per IP address, since there is no user yet. With `Auth:Mode = None` there is no user either, and the address stands in. Behind a reverse proxy, set `ReverseProxy:TrustedNetworks`, or every visitor counts as the proxy's one address.
- **Requests per minute:** connects, query runs and sign-in requests, in fixed one-minute windows.
- **Running queries:** the `QueryExecution:MaxConcurrentQueries` workers are shared by everyone, so one user may have only `MaxRunningQueriesPerUser` runs going at once. Runs still waiting in the queue count too, otherwise the queue itself could be filled.
- **Failed connects:** after `FailedConnectsBeforeWait` failures within `FailedConnectWaitMinutes`, connects are refused for `FailedConnectWaitMinutes`, without trying the connection. Every failure counts, including a host the guardrails refuse. A successful connect doesn't reset the count, or a script could connect to a database of its own between guesses.
- The counts are kept in memory, per server instance, and start over on a restart. That is enough for one instance; several instances behind a load balancer would need a shared store.

**CAPTCHA** is off by default. With `Captcha:Provider` set, it is asked when creating an account (not for Google, Microsoft or GitHub sign-in, where the provider has checked the person already), and, in place of the wait, on every connect after `FailedConnectsBeforeWait` failures.

The browser sends the solved token in a `Captcha-Token` header. A request without a valid, unused token gets `428`, and the UI shows the CAPTCHA.

| Provider | How it works | Trade-offs |
|---|---|---|
| `Turnstile` | Cloudflare's widget; the server checks each token with Cloudflare. | Needs a free Cloudflare account and two keys. If Cloudflare can't be reached, the check fails rather than letting everyone through. |
| `Altcha` | Self-hosted proof of work: the browser spends a few seconds solving a challenge from `GET /api/captcha/challenge`, and the server checks the answer itself. | No account, nothing leaves the server; a bot can still solve it, but each attempt costs it the same seconds. Needs HTTPS (or `localhost`). |

To try Turnstile locally, Cloudflare's test keys work on any host: site key `1x00000000000000000000AA` with secret `1x0000000000000000000000000000000AA` always passes, and secret `2x0000000000000000000000000000000AA` always fails.

## Security headers

Every response carries headers that tell the browser to be strict with this site. They are set in `SecurityHeadersMiddleware`; Kestrel's `Server` header is removed.

| Header | Value | Why |
|---|---|---|
| `Content-Security-Policy` | see below | Only the app's own scripts run, so injected script can't, even if a bug lets some in. |
| `Strict-Transport-Security` | `max-age=31536000` | Browsers use only HTTPS for a year. Sent only over HTTPS, not in Development and not for `localhost`. No `includeSubDomains` or `preload`: other services on sibling subdomains may still use HTTP, and a preload entry is hard to take back. |
| `X-Content-Type-Options` | `nosniff` | The browser keeps to the declared content type, so a JSON or text answer is never run as a script. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Other sites see only the origin, never paths or query strings (which may hold email confirmation codes). |
| `Cross-Origin-Opener-Policy` | `same-origin` | A page of another site that this app opens, or that opens it, can't reach its window. |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Browser features the app never uses stay off. |

The Content Security Policy:

- `default-src`, `connect-src` (the API and the SignalR WebSocket) and `worker-src` are `'self'`. Monaco's and ALTCHA's workers are bundled files, never `blob:` URLs. Images and fonts may also be `data:` URLs.
- `script-src 'self'`: no inline scripts and no `eval`. With `Captcha:Provider = Turnstile`, Cloudflare's `https://challenges.cloudflare.com` is allowed for its script and its iframe (`frame-src`, otherwise `'none'`).
- `style-src 'self' 'unsafe-inline'`: Monaco and the notifications set inline styles. Inline styles can't run code, so this is a small concession.
- `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, and `frame-ancestors 'none'`, so no other site can show the app inside a frame (against clickjacking).

In development the UI comes from the Vite dev server, which needs inline scripts for hot reload, so the policy only covers the UI when the API serves the built files. A reverse proxy in front of the app shouldn't add these headers a second time.

## Connection credentials

Connection settings are held in server memory only, per browser tab and connection. The password is encrypted with a key that exists only in the running process. A restart drops every connection, and users reconnect.

## Remembered passwords

Off unless `SavedConnections:PasswordKey` is set. Then the connect dialog offers "Remember password" for a saved connection, and the server keeps that password encrypted with AES-GCM in the app database.

- The password never comes back to the browser. To connect with it, the UI sends the saved connection's id with an empty password, and the server decrypts it for that connect only.
- It is used and kept only for the server, port, server type and user name it was typed for. Changing any of them in the saved connection forgets it, so a saved entry can't be pointed at another server to collect the password.
- Each value is bound to its saved connection and its owner, and the key is not in the database. A copy of the database file alone doesn't reveal the passwords; keep backups of the key apart from backups of the database.
- Changing or removing the key makes every remembered password unusable (users are asked for it again, and saving replaces it). There is no re-encryption.
- A wrong key (not base64, or not 32 bytes) stops startup.

Generate a key with `openssl rand -base64 32` (PowerShell: `[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))`) and set it with `dotnet user-secrets set SavedConnections:PasswordKey <key> --project src/MDBNavigator.API`, or as the environment variable `SavedConnections__PasswordKey`.

On an instance with open sign-up, setting the key means the server holds strangers' database passwords. Leave it unset there unless that is intended.

## Public demo

`compose.demo.yaml` turns the Compose setup into an instance strangers may use: they run any SQL they like, but only against the bundled sample database, and only to read (`docker compose -f docker-compose.yml -f compose.demo.yaml up -d --build`). Caddy in front gives it HTTPS; how the project's own demo is hosted: [hosting.md](hosting.md).

Why not let guests use their own databases instead: the server would then connect anywhere for anyone, and could be used to guess passwords on, or probe, other people's servers, from the demo's address.

**The database**

- Guests connect as `demo_reader`, which may read Pagila and `demo.measurements` and nothing else: no writing, no creating (Pagila's dump gives everyone `CREATE` on `public`; that is taken back), no temporary tables, no large objects, no other database.
- `rewards_report()` runs as its owner, the superuser, so guests can't call it. Nor `pg_cancel_backend` and `pg_terminate_backend`: guests share one role and could end each other's queries.
- Only `demo_reader`, only to `pagila` and only from the app's network may log in (`docker/sample-db/demo/pg_hba.conf`). The superuser is refused over the network even with its password. No password is checked for `demo_reader` there: any PostgreSQL role can change its own password, and a guest who did would lock everyone else out.
- Any role can also change its own default settings (`ALTER ROLE ... SET`, inside `BEGIN READ WRITE`). A guard in the database container puts `demo_reader`'s back every 10 seconds and logs a warning when they had been changed: `default_transaction_read_only = on`, `statement_timeout = 30s`, `idle_in_transaction_session_timeout = 60s` and `log_statement = all`.
- Every statement `demo_reader` runs is logged (`docker compose logs sample-db`), to look back at what someone tried.
- `temp_file_limit = 1GB` caps the disk one session's sorts and hashes may use; guests can't change it.
- The database is on an internal Docker network: only the app reaches it, and it has no way out to the internet.
- There is nothing to reset: guests can't change anything.

**The app**

| Setting | Demo | Default |
|---|---|---|
| `ConnectionGuard:Mode`, `Allow` | `AllowList`, `sample-db` | from `Auth` |
| `QueryExecution:MaxRunSeconds` | 60 | 0 |
| `QueryExecution:MaxRowsPerResultSet` | 50,000 | 100,000 |
| `QueryExecution:MaxRowsPerRun` | 50,000 | 0 |
| `QueryExecution:MaxRowBytes` | 1 MB | 0 |
| `QueryExecution:MaxConcurrentQueries` | 4 | 8 |
| `RateLimiting:MaxRunningQueriesPerUser` | 1 | 3 |
| `RateLimiting:QueriesPerMinute` | 20 | 60 |
| `ConnectionCache:SlidingExpirationMinutes` | 60 | 480 |

A long statement is stopped by `demo_reader`'s `statement_timeout` (30 s), with PostgreSQL's own message. A guest can `SET statement_timeout = 0`. That lasts one run (each run opens its own connection, and Npgsql resets the session when the connection goes back to its pool), and within that run `MaxRunSeconds` stops it. `QueryExecution:CommandTimeoutSeconds` stays off: it would race the `statement_timeout`, and when it wins the guest sees only "Exception while reading from stream".

**The containers:** the app may use 512 MB and one CPU, the database 1 GB and one CPU. Logs are rotated at five files of 10 MB per container.

**HTTPS and the server**

- **Caddy** (`docker/caddy/Caddyfile`) gets the certificates from Let's Encrypt and renews them, redirects HTTP to HTTPS and the other names (`MDBNAV_REDIRECT_DOMAINS`; on the project's demo the bare domain and `www.`) to the demo's address, and passes requests on to the app. It adds no security headers (the app sets them) and removes its own `Server` and `Via` headers from every answer, its redirects and error pages included.
- **Cloudflare only answers DNS:** its proxy is off, so TLS ends on the demo's server and Cloudflare never sees guests' emails or cookies. Turning the proxy on would need Caddy's `trusted_proxies` with Cloudflare's ranges, or every visitor would get a Cloudflare address.
- **Visitors' addresses:** Caddy replaces any `X-Forwarded-For` a visitor sends with the address it sees. The app believes forwarded headers only from `proxy-net`, the network that holds just Caddy and the app (`MDBNAV_PROXY_SUBNET`, which is also `ReverseProxy:TrustedNetworks`).
- **IPv4 only:** no name has an `AAAA` record. Docker passes IPv6 connections to a container from an address of its own, so every IPv6 visitor would share one address and its limits.
- **No request logging in Caddy:** no access log, and three more of its logs are off because each records the visitor's address: the error log (with the whole URL, when the app can't answer, e.g. while it restarts), the reverse proxy's warnings (with the headers, when a visitor drops the connection mid-answer) and failed TLS handshakes. URLs carry invite codes and sign-in links, and addresses are personal data. Caddy still logs its certificates and its own problems; the app's log says what went wrong with a request.
- **Compression only for the UI's files** (`/assets/*`): compressing an answer that holds a secret next to text a visitor controls can leak the secret (BREACH).
- **Reachable from outside:** ports 80 and 443, and SSH with keys only (no passwords, no root). The provider's firewall allows nothing else; it sits outside the server because Docker's published ports bypass a firewall on the server itself. The app's port 8080 is published on `127.0.0.1` only, the database not at all.
- **Updates:** the system's security updates and Docker's packages install by themselves every day, with a reboot at 04:30 UTC when one needs it. Every Sunday at 03:30 UTC, `deploy/update.sh` rebuilds the images on fresh base images (.NET, PostgreSQL 17, Caddy 2.11) and restarts what changed. It doesn't pull new code. NuGet and npm packages are updated in the repository.
- **No backups:** the visitor list must be gone 90 days after the last visit, as the demo terms promise, and a backup would keep it longer. Everything else is rebuilt from the repository and the server's `.env`.
- **Data Protection keys** (they sign the sign-in cookies) are stored unencrypted in the SQLite file, which the log warns about at every start. Whoever can read that volume already controls the server, so they are not encrypted further.

**Guests** (`Demo` settings, off unless `Demo:Enabled`)

Sign-up stays closed. Someone the owner invites opens `/?code=<invite code>` (the public start page), presses "Try the demo", gives a name and an email, agrees to the demo terms, and gets a sign-in link by email. The link opens a page with a Start button, and Start begins a session of `Demo:SessionMinutes` (10).

- **The invite codes** (`Demo:InviteCodes`) are secrets of at least 16 characters, each with a name (LinkedIn, CV, ...). A given code is compared in constant time against all of them. Changing or blanking one stops only the links that carry it; returning visitors don't need a code. The code isn't checked before the form is sent, so the start page can't be used to test codes without a CAPTCHA. Each visitor keeps the name of the link they first came by (`demo_visitors.invite_name`), and the owner's "new visitor" email names it.
- **The emailed link** proves the address: the visitor is recorded only when a link is used, so nobody can put a name on someone else's email, and the visitor list holds only confirmed addresses. A link works once, for 30 minutes, and only its SHA-256 hash is stored. Nothing happens when the link is merely opened (a mail scanner may do that); the session starts with the Start button.
- **One throwaway account per session:** no password, an email at the reserved `.invalid` domain, role `Guest`. The session cookie expires with the session and is never renewed; on every request a guest's session is also checked in the database, so a session that ended early stops at once. When it ends (time up, or End the demo), the account is deleted with everything it had: saved connections, cached credentials, running queries, through the same clean-up as deleting an account. A background job does this within a minute of the end, and also removes links after a day.
- **Guests have no account page** and can't use Identity's `manage` endpoints, so a guest account can't be given a real email or a password and kept.
- **The demo connection** is opened by the server (`POST /api/demo/connect`) with `Demo:Connection`, so its password never reaches the browser. The connection shows its server, user and database, like any other.
- **Limits:** `SessionsPerVisitorPerDay` (3 within 24 hours), `MaxActiveGuests` (10), `SessionsPerIpPerHour` (3, counting only starts that worked). Sessions start one at a time, so the counts can't be raced. A refused start leaves the link usable.
- **Email can't be used to flood someone:** a CAPTCHA (ALTCHA in `compose.demo.yaml`), `LinkRequestsPerIpPerHour` (10), and at most `LinkEmailsPerAddressPerHour` (3) links to one address within an hour. More are not sent, and the answer is the same.
- **Nothing tells who has visited:** a returning visitor's link request gets the same answer whether or not the address is known, and every email is sent after the answer, so the timing doesn't tell either.
- **Personal data:** the visitor list (name, email, the terms' version and when they were agreed to, visits) is deleted 90 days after the last visit, a promise in the terms, so the clean-up runs even after the demo is switched off. Names and emails never go into the log; the owner gets them by email (`Demo:OwnerEmail`) for every new visitor.
- The per-address counts are kept in memory, like the rate limits, and start over on a restart.

**Violations and blocks** (`Demo:ViolationsBeforeBlock`, 20; `Demo:BlockHours`, 24)

What the server refuses a guest is counted per session. At 20, the session ends at once (and any other running session of the same visitor), the account is deleted as usual, the visitor's email can't start sessions or get links for 24 hours, and the owner gets an email with the name, the email and the counts. The run that ended it says so in its Error tab; the UI also checks the session every 30 seconds and then shows `/demo/ended`. The start page names the rule.

- **Counted:** permission errors (SQLSTATE `42501`, and `25006`: a write in `demo_reader`'s read-only transactions), a guest calling `account/*` or `manage/*` (the UI never does); every failed connect or reconnect and every host the guard refuses; the run's time and row limits, PostgreSQL's `statement_timeout`, `temp_file_limit` and connection limit (`57014`, `53400`, `53300`), "a query is already running", the failed-connect wait or its CAPTCHA, and the per-minute connect and query limits. The provider decides which database errors are refusals (`IDatabaseErrorDescriber.Classify`).
- **Not counted:** mistakes (syntax errors, missing tables), Cancel, results cut at `MaxRowsPerResultSet` (`select * from demo.measurements` is fine), expired connections. SQL is never scanned for keywords.
- The demo connection goes through the same connect, so if the sample database is down, a guest's retries count too; nobody retries 20 times in a session.
- Counts are in memory, per session, and start over on a restart. Blocks are in the database (`demo_visitors.blocked_until_utc`). The block refuses starts with a message; a link request for a blocked email gets the usual answer and no email, so the answer doesn't tell which emails are blocked.
- **No IP addresses are stored.** An address block is undone with a VPN in a minute, and storing addresses would be one more piece of personal data to explain. A block stops casual misuse and tells the owner; if someone keeps coming back with new emails, the owner blanks the invite code that visitor came by (the owner's email names it). What keeps the demo safe is the read-only role, the guard and the limits above.
- The log says only "Demo guest blocked after 20 refused actions (... permission, ... connection, ... limit)": no name, email or account id.

**What remains possible:** `SET work_mem` to a large value lets one query use a lot of memory; the container limit caps it, and at worst PostgreSQL restarts. Guests see each other's query text in `pg_stat_activity`. Both are accepted for public sample data.
