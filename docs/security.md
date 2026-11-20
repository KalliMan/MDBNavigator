# Security

How MDBNavigator protects an instance that strangers can use: which databases they may reach, how much they may do, and how credentials are kept. Sign-in itself is designed in [specs/authentication.md](specs/authentication.md). The settings named here are listed in the README's [Configuration](../README.md#configuration).

- [Connection guardrails](#connection-guardrails)
- [Rate limits and CAPTCHA](#rate-limits-and-captcha)
- [Security headers](#security-headers)
- [Connection credentials](#connection-credentials)
- [Remembered passwords](#remembered-passwords)

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
