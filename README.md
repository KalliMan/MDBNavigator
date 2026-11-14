# MDBNavigator

A web-based database navigator: connect to a database server, browse its databases, tables, views, functions and procedures, generate scripts, and run SQL with results streamed into a virtualized grid.

<img width="2554" height="1232" alt="MDBNavigator: schema tree, SQL editor and result grid" src="https://github.com/user-attachments/assets/d18cbd99-07ab-432b-9002-b2d674b1cb65" />

**Supported servers:** PostgreSQL. The provider layer is pluggable (`IDbServerFactory`); MS SQL Server is planned but not implemented yet, so the connect dialog doesn't offer it.

> **Security status:** sign-in is in place ([design](docs/specs/authentication.md)): accounts with email and password, optionally Google, Microsoft and GitHub, and each user's connections and results are separate. With open sign-up, connections to the server's own network (localhost, private ranges, cloud metadata) are refused ([connection guardrails](#connection-guardrails)). Saved connections remember passwords only when a key is configured; they are encrypted with AES-GCM and never sent back to the browser ([remembered passwords](#remembered-passwords)). Connecting and running queries are [rate limited](#rate-limits-and-captcha) per user, and an optional CAPTCHA can be asked on sign-up and after repeated failed connects. Responses carry [security headers](#security-headers), including a Content Security Policy.

## Features

- Several connections at once, each with a schema tree (databases, schemas, tables with columns and indexes, views, functions, procedures).
- Script generation: select the first N rows, `CREATE`, `INSERT` and `DROP` for tables, plus definitions and `CREATE`/`DROP` scripts for views, functions and procedures.
- SQL editor (Monaco) with PostgreSQL highlighting, one tab per query, all tabs kept open in the background.
- Streamed execution. Rows arrive over SignalR in batches while the query runs, and the grid shows them as they come. A script runs statement by statement, as in psql: each statement commits on its own unless the script opens a transaction, a failing statement stops the script, and the error names the statement and its line. Cancellation and a server-side row limit per result set (100,000 rows by default) are supported.
- Virtualized result grid: only visible rows and columns are rendered, so large and wide results stay responsive. Select a range of cells, rows or columns with the mouse or the keyboard and copy it as tab-separated text, with or without a header row. Drag a header edge to resize a column, or double-click it to fit the content. Double-click a cell to see its full value, with JSON formatted for reading. Sort by a column and filter across all columns; both work on the loaded rows, mark the matches, and keep each row's original number.
- One tab per result set when a run returns several. A switch shows the active result as a table or as CSV text, and Export downloads it as CSV or JSON: the loaded rows, with the current sort and filter. CSV writes NULL as an empty field and an empty string as `""`; JSON keeps `bigint` and `numeric` as strings, so no digit is lost.
- A failed statement gets an Error tab next to the results of the statements before it, with the full message, the statement's number and line, and what happened to the rest of the script.
- Light and dark theme, following the system setting until you pick one in the top bar. Each server has its own color in the tree, on its query tabs and in the query bar, so it is clear where a query runs. The server and database in the query bar are menus: pick another connected server or database and the tab's SQL runs there next time, with the editor text kept. Each query tab's status bar starts with its server and database, and warns when the results on screen came from somewhere else.
- Saved connections: the connect dialog lists the connections you saved (name, server, port, default database, user and color, and whether a password is remembered; never the password itself). Tick "Save this connection" to save one when it connects. The name starts as server:port (while nothing is saved) and can be changed. The dialog opens with the connection you used last (in this browser), or the first saved one. The default database is the one opened on connect and expanded in the tree. With a key configured, a saved connection can also remember its password, encrypted on the server; the password is then used without being sent back to the browser, and only for the same server and user.
- Clear errors: PostgreSQL `DETAIL` and `HINT` are included, for example which objects block a `DROP`.

## Repository layout

| Path | What it is |
|---|---|
| `MDBNavigator.Domain` | Entities, value objects (`ConnectionSettings`), enums, domain exceptions. No dependencies. |
| `MDBNavigator.Application` | Use cases as MediatR requests and handlers (`Features/...`), validators, DTOs, and the contracts the other layers implement (`IDatabaseProvider`, `IConnectionCache`, `IBatchNotifier`, ...). |
| `MDBNavigator.Infrastructure` | Implementations that don't depend on a database server: connection cache, background query queue and execution registry, SignalR hub and notifier. |
| `MDBNavigator.Infrastructure.Accounts` | The app's own database (EF Core on SQLite, with migrations): accounts with ASP.NET Core Identity, the admin seeding, saved connections and the Data Protection keys. |
| `MDBNavigator.Infrastructure.PostgreSQL` | PostgreSQL provider (Npgsql + Dapper): schema queries, script generation, streaming, cell conversion (`JsonCellValue`), error descriptions. |
| `MDBNavigator.Infrastructure.PostgreSQL.Tests` | Unit tests of the PostgreSQL provider (xUnit). |
| `MDBNavigator.API` | ASP.NET Core host: controllers, session filter, exception middleware, configuration. Serves the built UI in production. |
| `mdb-navigator-ui` | React + TypeScript + Vite single-page app. See [its README](mdb-navigator-ui/README.md). |

### Tech stack

- **Backend:** .NET 10, ASP.NET Core, MediatR 12.4.1, FluentValidation, Dapper, Npgsql, SignalR. MediatR is pinned to 12.x on purpose because version 13 and later need a commercial licence.
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, Monaco Editor with `monaco-sql-languages`, `@tanstack/react-virtual`, immer, axios, `@microsoft/signalr`, react-toastify.

## Running locally

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) 20 or later (22 LTS recommended)
- A PostgreSQL server. The quickest option is Docker:

  ```sh
  docker run --name mdbnavigator-pg -p 5432:5432 -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=secret -d postgres:17
  ```

  For sample data, run [`mdb-navigator-ui/dummy-data.sql`](mdb-navigator-ui/dummy-data.sql) against a scratch database. It drops and recreates its tables (`departments`, `employees`, `customers`, `orders`, ...), so don't run it against a database you care about.

### 1. Start the API

Run the `https` launch profile, either from Visual Studio or with:

```sh
dotnet run --project MDBNavigator.API --launch-profile https
```

The API listens on `https://localhost:3001` and `http://localhost:3002`; the UI's dev server proxies to the latter. On first start it creates its SQLite database, `MDBNavigator.API/data/mdbnavigator.db` (git-ignored).

Development settings (`appsettings.Development.json`) use accounts with emails written to the log instead of being sent: when you create an account, the confirmation link appears in the API's output. To skip sign-in on your own machine, set `Auth:Mode` to `None` in the API's user secrets.

### 2. Start the UI

```sh
cd mdb-navigator-ui
npm ci
npm run dev
```

Open http://localhost:3000 and create an account. The dev server forwards `/api` and `/batchCommandResult` to the API, so the browser sees a single origin, as in production. To pre-fill the connect dialog during development, copy `.env.development.local.example` to `.env.development.local` and set your server and credentials. That file is git-ignored, and its values are never included in production builds.

### Production build (single origin)

In production the API serves the UI itself, so the browser talks to one origin. This is required: the sign-in cookie is `SameSite=Lax` and the API has no CORS policy.

1. `npm run build` in `mdb-navigator-ui`. `.env.production` uses relative URLs (`/api`, `/batchCommandResult`).
2. Copy the contents of `mdb-navigator-ui/dist` into `MDBNavigator.API/wwwroot`.
3. Run or publish the API. It serves `index.html` for `/` and for any client-side route that isn't an API or hub endpoint.

The API serves static files only when `wwwroot/index.html` exists, so in development (UI on the Vite dev server) it doesn't.

## Configuration

Settings live in `MDBNavigator.API/appsettings.json`. Any setting can be overridden with an environment variable, using `__` between section and key, for example `QueryExecution__MaxRowsPerResultSet=50000`.

| Setting | Default | Meaning |
|---|---|---|
| `QueryExecution:BatchSize` | `500` | Rows per SignalR batch message. |
| `QueryExecution:CommandTimeoutSeconds` | `0` | Database command timeout, per statement. `0` means no timeout; long queries are stopped with the cancel endpoint. |
| `QueryExecution:MaxConcurrentQueries` | `8` | Background workers running streamed queries in parallel. Further runs wait in a queue. |
| `QueryExecution:MaxRowsPerResultSet` | `100000` | Rows streamed per result set. A longer result stops there and is marked `truncated`; the rest of the script still runs. `0` means unlimited. See [how a script runs](#how-a-script-runs). |
| `ConnectionCache:SlidingExpirationMinutes` | `480` | A connection's settings are dropped after this long without use, and the user has to reconnect. |
| `Auth:Mode` | `Accounts` | `Accounts`: sign-in required. `None`: no sign-in; only requests from the local machine are served, and saved connections belong to one local user. Connections saved in one mode don't show up in the other. |
| `Auth:SignUp` | `Open` | `Closed`: nobody can create an account; the first admin comes from `Auth:Admin`. |
| `Auth:Admin:Email`, `Auth:Admin:Password` | | The first admin, created at startup if it doesn't exist. Put them in user secrets or environment variables. |
| `ConnectionStrings:AppDb` | `Data Source=data/mdbnavigator.db` | The app's own SQLite database (accounts, saved connections; used in both auth modes). A relative path is taken from the app's folder. Keep it on a persistent local disk; in Docker, mount the `data` folder as a volume. |
| `SavedConnections:PasswordKey` | | 32 random bytes in base64 (`openssl rand -base64 32`). When set, saved connections can remember passwords. A secret: user secrets or an environment variable. See [remembered passwords](#remembered-passwords). |
| `Authentication:{Google\|Microsoft\|GitHub}:ClientId`, `ClientSecret` | | Sign-in with that provider, switched on when both are set (user secrets or environment variables). The provider's app must allow the return address `https://{host}/api/auth/signin-google` (or `-microsoft`, `-github`). |
| `Email:Delivery` | `None` | `Smtp` turns on email confirmation and password reset; `Log` (Development only) writes the emails to the log instead. Also needs `Email:AppBaseUrl` (the app's address for links), and for SMTP `Email:FromAddress`, `Email:Smtp:Username` and `Email:Smtp:Password`. `Email:Smtp:Host` and `Port` default to Brevo (`smtp-relay.brevo.com`, 587); set them only for another mail server. See the [spec](docs/specs/authentication.md) for what changes for existing accounts. |
| `RateLimiting:AuthRequestsPerMinute` | `10` | Sign-in, register and password requests per minute and IP address. |
| `RateLimiting:ConnectsPerMinute` | `10` | Connect and reconnect requests per minute and user. |
| `RateLimiting:QueriesPerMinute` | `60` | Query runs started per minute and user. |
| `RateLimiting:MaxRunningQueriesPerUser` | `3` | Query runs one user may have running or waiting for a worker at once, across all their tabs. |
| `RateLimiting:FailedConnectsBeforeWait`, `FailedConnectWaitMinutes` | `5`, `10` | After this many failed connects within the minutes, connecting is refused for the minutes, or needs a CAPTCHA when one is set. See [rate limits and CAPTCHA](#rate-limits-and-captcha). |
| `Captcha:Provider` | `None` | `Turnstile` (Cloudflare) or `Altcha` (self-hosted) asks for a CAPTCHA when creating an account and after repeated failed connects. See [rate limits and CAPTCHA](#rate-limits-and-captcha). |
| `Captcha:Turnstile:SiteKey`, `SecretKey` | | Needed with `Turnstile`, from the Cloudflare dashboard. The secret key goes in user secrets or an environment variable. |
| `ConnectionGuard:Mode` | from `Auth` | Which database hosts users may connect to: `Public`, `AllowList` or `Off`. When not set: `Public` with `Auth:Mode = Accounts` and `Auth:SignUp = Open`, otherwise `Off`. See [connection guardrails](#connection-guardrails). |
| `ConnectionGuard:Allow` | | Host names, IP addresses or ranges (`10.20.0.0/16`) allowed in addition (`Public`) or exclusively (`AllowList`). Development allows `localhost`. |

Environment variables read by the host:

| Variable | Meaning |
|---|---|
| `ASPNETCORE_ENVIRONMENT` | `Development` adds exception messages and stack traces to error responses. Any other value returns a generic message for unexpected errors. |
| `ASPNETCORE_URLS` | Addresses to listen on, for example `http://0.0.0.0:8080`. The launch profiles set these for local runs. |
| `ASPNETCORE_HTTPS_PORT` | When set, HTTP requests are redirected to HTTPS on this port, except in Development, where the UI's dev proxy uses the HTTP port. Leave it unset behind a TLS-terminating proxy; `X-Forwarded-Proto` and `X-Forwarded-For` are honoured. |

There is no CORS policy: the UI always comes from the API's own origin (in development through the Vite proxy).

### Connection guardrails

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

### Rate limits and CAPTCHA

The server opens database connections and runs queries for its users, so without limits one user could use it to guess database passwords, scan hosts and ports, or keep every query worker busy. A refused request gets `429` with a message and, where the wait is known, a `Retry-After` header. Every `RateLimiting` value can be set to `0` to switch that limit off.

- **Per user:** the limits count per signed-in user, so people behind one shared address (an office, a VPN) don't share them. Sign-in requests count per IP address, since there is no user yet. With `Auth:Mode = None` there is no user either, and the address stands in.
- **Requests per minute:** connects, query runs and sign-in requests, in fixed one-minute windows.
- **Running queries:** the `QueryExecution:MaxConcurrentQueries` workers are shared by everyone, so one user may have only `MaxRunningQueriesPerUser` runs going at once. Runs still waiting in the queue count too, otherwise the queue itself could be filled. A cancelled or finished run frees its place.
- **Failed connects:** after `FailedConnectsBeforeWait` failures within `FailedConnectWaitMinutes`, connects are refused for `FailedConnectWaitMinutes` ("try again in N minutes"), without trying the connection. Every failure counts: a wrong password, a host that doesn't answer, a host the [connection guardrails](#connection-guardrails) refuse. A successful connect doesn't reset the count, or a script could connect to a database of its own between guesses.
- The counts are kept in memory, per server instance, and start over on a restart. That is enough for one instance; several instances behind a load balancer would need a shared store.

**CAPTCHA.** Off by default. With `Captcha:Provider` set, a CAPTCHA is asked in two places:

- **Creating an account,** always. Signing in through Google, Microsoft or GitHub asks for none, since the provider has checked the person already.
- **Connecting after `FailedConnectsBeforeWait` failures,** in place of the wait: every connect needs a newly solved CAPTCHA until the wait would have ended. A successful connect doesn't end it early, for the same reason it doesn't reset the count.

The browser sends the solved token in a `Captcha-Token` header. A request without one, or with an invalid or already used one, gets `428` with a message, and the UI shows the CAPTCHA. Each token works once, so the UI gets a new one after every attempt.

| Provider | How it works | Trade-offs |
|---|---|---|
| `Turnstile` | Cloudflare's widget. The server checks each token with Cloudflare's `siteverify`. | Needs a (free) Cloudflare account and the two keys. The visitor's browser talks to Cloudflare. If Cloudflare can't be reached, the check fails rather than letting everyone through. |
| `Altcha` | Self-hosted proof of work: the browser solves a challenge from `GET /api/captcha/challenge`, which takes it a few seconds of computing, and the server checks the answer itself. | No account and nothing leaves the server. A bot can still solve it, but each attempt costs it the same seconds. Challenges expire after 10 minutes and are signed with a key made at startup, so a restart only means the widget fetches a new one. Needs HTTPS (or `localhost`): the widget uses the browser's Web Crypto. |

To try Turnstile locally, Cloudflare's test keys work on any host: site key `1x00000000000000000000AA` with secret `1x0000000000000000000000000000000AA` always passes, and secret `2x0000000000000000000000000000000AA` always fails.

### Security headers

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

**How connection credentials are kept.** Connection settings are held in server memory only, per browser tab and connection. The password is encrypted with a key that exists only in the running process. A restart drops every connection, and users reconnect.

### Remembered passwords

Off unless `SavedConnections:PasswordKey` is set. Then the connect dialog offers "Remember password" for a saved connection, and the server keeps that password encrypted with AES-GCM in the app database.

- The password never comes back to the browser. To connect with it, the UI sends the saved connection's id with an empty password, and the server decrypts it for that connect only.
- It is used and kept only for the server, port, server type and user name it was typed for. Changing any of them in the saved connection forgets it, so a saved entry can't be pointed at another server to collect the password.
- Each value is bound to its saved connection and its owner, and the key is not in the database. A copy of the database file alone doesn't reveal the passwords; keep backups of the key apart from backups of the database.
- Changing or removing the key makes every remembered password unusable (users are asked for it again, and saving replaces it). There is no re-encryption.
- A wrong key (not base64, or not 32 bytes) stops startup.

Generate a key with `openssl rand -base64 32` (PowerShell: `[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))`) and set it with `dotnet user-secrets set SavedConnections:PasswordKey <key> --project MDBNavigator.API`, or as the environment variable `SavedConnections__PasswordKey`.

On an instance with open sign-up, setting the key means the server holds strangers' database passwords. Leave it unset there unless that is intended.

## API

All endpoints are under `/api`. With `Auth:Mode = Accounts` they require sign-in (the `mdbnav_session` cookie from `POST /api/auth/login?useCookies=true`); a request without it gets `401`. Every request must also carry an `id` header with the client's tab id. The UI generates one per browser tab and keeps it in `sessionStorage`. Connections, running queries and SignalR messages are scoped to the session `{userId}:{tabId}`, so a tab id alone never reaches another user's data. A request without exactly one `id` header gets `400`. [`MDBNavigator.API.http`](MDBNavigator.API/MDBNavigator.API.http) has sample requests.

Sign-in endpoints (`/api/auth`): `settings` (anonymous: mode, sign-up, providers, email, CAPTCHA provider and Turnstile site key), `register`, `login`, `logout`, `me`, `external/{provider}`, the signed-in user's own `account` (password, linked providers, deletion), plus Identity's `confirmEmail`, `resendConfirmationEmail`, `forgotPassword`, `resetPassword` and `manage/info`. See the [authentication spec](docs/specs/authentication.md).

Errors are returned as JSON:

```json
{ "statusCode": 400, "message": "Connection failed: password authentication failed for user \"admin\"", "details": null }
```

`details` contains the stack trace in Development only. Database and validation errors are `400`, a missing object is `404`, a conflict with stored data (a saved connection name already taken, the list full) is `409`, a [rate limit](#rate-limits-and-captcha) is `429`, a missing or invalid CAPTCHA is `428`, and anything else is `500`.

| Method and path | Purpose |
|---|---|
| `POST databaseConnection/connect` | Body: `{ serverType, serverName, port, userName, password, databaseName?, savedConnectionId? }`. Tests the connection and returns `{ connectionId, connectionName, serverName, port, serverType, userName, databaseName, savedConnectionId }`. `databaseName` is opened whenever a request names no database (the connect test, the database list); without it, the server's default (PostgreSQL: the database named like the user). With an empty `password` and a `savedConnectionId`, the saved connection's [remembered password](#remembered-passwords) is used (same server, port and user only; otherwise `400`); the result then carries that `savedConnectionId`, so a reconnect can send it again. After repeated failed connects, needs a `Captcha-Token` header when a CAPTCHA is set. |
| `POST databaseConnection/reconnect/{connectionId}` | Same body. Replaces the settings for an existing connection id. |
| `POST databaseConnection/disconnect/{connectionId}` | Forgets the connection and cancels its running queries. |
| `GET savedConnections` | The user's saved connections, by name: `[{ id, name, serverType, serverName, port, databaseName, userName, color, hasPassword }]`. Never a password: `hasPassword` says whether one is remembered. |
| `GET savedConnections/{id}` | One saved connection. `404` if it doesn't exist or belongs to someone else. |
| `POST savedConnections` | Body: `{ name, serverType, serverName, port, databaseName?, userName, color?, rememberPassword, password? }` (`color`: `#rrggbb`, or null for automatic). `rememberPassword` is required: `true` with `password` remembers it (`400` when no key is configured). `201` with the saved connection. `409` when the name is taken (ignoring case) or the user already has 100. |
| `PUT savedConnections/{id}` | Same body; replaces all fields. `rememberPassword: false` forgets the password; `true` without `password` keeps it, unless the server, port, server type or user name changed. `200` with the result, `404`, or `409` for a taken name. |
| `DELETE savedConnections/{id}` | `204`, or `404`. Deleting an account deletes its saved connections. |
| `DELETE savedConnections/{id}/password` | Forgets the remembered password; the saved connection stays. `204`, or `404`. |
| `GET databaseSchema/{databases\|tables\|storedProcedures\|functions\|views}/{connectionId}` | Schema objects. All except `databases` take `?database=`. |
| `GET databaseSchema/tableDefinition/{connectionId}?database=&schema=&table=` | Columns, indexes and constraints of a table. |
| `GET databaseCommand/{script}/{connectionId}?database=&schema=&...` | Generated SQL text: `tableRecordsScript`, `createTableScript`, `insertTableScript`, `procedureDefinition`, `viewDefinition`, and so on. Object names are always query parameters, never path segments. |
| `POST databaseCommand` | Starts a streamed query (see below). |
| `POST databaseCommand/cancel/{executionId}` | Cancels a run. Returns `204` whether or not the run still exists. |
| `GET captcha/challenge` | Anonymous, only with `Captcha:Provider = Altcha`: a new ALTCHA challenge. Rate limited per IP address. |

### Streaming query results

Query results never travel in an HTTP response. They are pushed over a SignalR hub, which lets a large result render while it is still being read and lets the user cancel at any time.

**1. Connect to the hub** at `/batchCommandResult?tabId={tabId}`, using the same tab id as the `id` header (and, with accounts, the session cookie). The server sends only to that session's group (`{userId}:{tabId}`), and clients never call the hub. Connect before starting a query, because messages sent while you are not connected are lost.

**2. Start the run.** The client generates a unique `executionId` and posts:

```http
POST /api/databaseCommand
id: {sessionId}
Content-Type: application/json

{ "connectionId": "...", "databaseName": "postgres", "cmdQuery": "select * from orders; select 1", "executionId": "{uuid}" }
```

The response is `202 Accepted` with `{ "id": "{executionId}" }`. The run is queued and starts once a worker is free.

**3. Receive the run's messages.** Before each statement of the script, one `StatementStarted`:

```json
{ "executionId": "...", "statementIndex": 0, "statementCount": 2, "line": 1 }
```

Then `BatchCommandResult` messages, zero or more per statement:

```jsonc
{
  "id": "{executionId}_{resultSetIndex}",   // identifies the result set
  "executionId": "...",
  "resultSetIndex": 0,
  "index": 0,                               // batch number within the result set
  "isFirstBatch": true,
  "isLastBatch": false,
  "truncated": false,
  "skippingRest": false,
  "fields": [ { "index": 0, "fieldName": "order_id", "category": "Number", "dataTypeName": "integer" } ],
  "rows": [ [1, "2024-01-15 00:00:00", "199.90", null] ]
}
```

- `fields` is present only on the first batch of a result set.
- Every result set that returns columns ends with exactly one batch where `isLastBatch` is `true`. That batch can have no rows, which is how an empty result still delivers its columns. A result set can be a single batch that is both first and last.
- `resultSetIndex` is the statement's `statementIndex`. Statements that return no columns (`INSERT`, `UPDATE`, DDL) send no batches, so indexes can skip numbers.
- `truncated` and `skippingRest` are set only on a result set's last batch. `truncated`: the result has more rows than `MaxRowsPerResultSet` and stops here. `skippingRest`: the server is still reading the statement's remaining rows and throwing them away, so the next statement starts when that is done (see [how a script runs](#how-a-script-runs)).
- Messages of one run arrive in order.

**Column types** are the same for every database server. `category` is one of `Number`, `Text`, `Boolean`, `DateTime`, `Json`, `Binary` and `Other`, and decides how the UI sorts and formats the column. `dataTypeName` is what the database calls the type (`jsonb`, `numeric(10, 2)`); the UI shows it and never interprets it. A shared mapper (`DbTypeCategories`) derives the category from the .NET type, and a provider corrects only what its database knows better (PostgreSQL: `json` and `jsonb` arrive as strings). The enum is `DbTypeCategory.cs`, and the UI type is `dbTypeCategory.ts`. Change them together.

**Cell values** are JSON values chosen so nothing is lost in JavaScript:

| Database value | JSON |
|---|---|
| `NULL` | `null` |
| integers up to 32 bits, finite floats | number |
| `bigint`, `numeric`/`decimal`, `NaN`/`Infinity` | string, because a JS number can't hold them exactly |
| `boolean` | boolean |
| `timestamp`, `timestamptz`, `time`, `timetz` | string, as PostgreSQL writes them: `2026-01-22 15:19:01.785309`, `15:19:01`. `timestamptz` is always in UTC and ends with `+00`. |
| `date`, `uuid`, `text`, ... | string |
| `bytea` | string in PostgreSQL hex form, `\x0a1b...` |
| arrays | array, converted element by element |
| `hstore` | object |
| anything else (`interval`, `inet`, ranges, ...) | its text representation |

The server side is `JsonCellValue.cs` and the client type is `CellValue` in `mdb-navigator-ui/src/models/databaseCommand/result/cellValue.ts`. Change them together.

**4. Receive exactly one `CommandFinished` message**, which always comes after the run's last batch:

```json
{ "executionId": "...", "status": "Completed", "rowCount": 1234, "recordsAffected": 0, "elapsedMs": 87, "truncated": false, "error": null }
```

| Field | Meaning |
|---|---|
| `status` | `Completed`, `Failed` or `Cancelled`. |
| `rowCount` | Rows streamed, across all result sets. |
| `recordsAffected` | Rows changed by `INSERT`/`UPDATE`/`DELETE`, summed over the script's statements. `-1` when no statement reported a count. |
| `elapsedMs` | Time from when a worker started the run. Time spent waiting in the queue is not included. |
| `truncated` | `true` when at least one result set stopped at `MaxRowsPerResultSet`. |
| `error` | Message for `Failed` runs, including the server's detail and hint. For a script with several statements it starts with the failing one: `Statement 2 of 5 (line 14): ...`. Batches sent before the error stay valid. |

**Cancelling:** `POST /api/databaseCommand/cancel/{executionId}`. The outcome arrives as the run's `CommandFinished` with status `Cancelled`. Disconnecting a connection cancels all of its runs. Starting a run with an `executionId` that is already running cancels the earlier one.

**If the hub drops**, batches sent in the meantime are lost. A client should treat its running executions as failed and run them again once it has reconnected.

### How a script runs

The server splits the script into statements at its semicolons and runs them one after another on one connection, opened for the run. This is what psql does.

- **Splitting** follows psql's rules: a semicolon inside a string, a quoted identifier, dollar-quoted text, a comment, parentheses or a `BEGIN ATOMIC ... END` function body does not split. psql's backslash commands are not supported.
- **Each statement commits on its own.** To make several statements all-or-nothing, put them between `BEGIN` and `COMMIT`; a long data script is also much faster that way. A transaction still open when the script ends is rolled back, because the connection is closed.
- **The first failing statement stops the script.** Earlier statements keep their results and, outside a transaction, their changes.
- **The row limit counts per result set.** A statement that only reads (`SELECT`, `TABLE`, `VALUES`, `WITH` or `SHOW`, without `INSERT`, `UPDATE`, `DELETE` or `MERGE` in it) and runs outside a transaction is cancelled at the limit, which is immediate. Any other statement is read to its end with the remaining rows thrown away, because cancelling it would undo its changes or abort the open transaction. For a very large result that takes a while; the run can be cancelled as usual.
- A `SELECT` that calls a function which changes data, and returns more rows than the limit, is cancelled like any other `SELECT`, and the function's changes are undone. Run it between `BEGIN` and `COMMIT` to have it read to the end.

The splitter and these rules are `PostgresScriptSplitter` and `PostgresStatementRules` in the PostgreSQL provider, with unit tests.

## Development

- Backend: `dotnet build MDBNavigator.sln`.
- UI: `npm run check` (type check plus type-aware ESLint with zero warnings allowed) and `npm run build` in `mdb-navigator-ui`.
- Tests: `dotnet test MDBNavigator.sln` runs the backend's unit tests (xUnit; so far the PostgreSQL script splitter, its stop rules and the cell values). `npm test` in `mdb-navigator-ui` runs the UI's unit tests (Vitest; so far the result grid's pure functions, the CSV and JSON export, the status bar's and the result pane's run texts, where a new query opens, and the tree's column type names).

### Docker

The Dockerfiles and `docker-compose.yml` are out of date (for example, the API Dockerfile still copies projects that no longer exist) and will be reworked. Don't use them for now.

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md). Contributors need to sign the [Contributor License Agreement](CLA.md) before a pull request can be merged.

## License

Licensed under the [Apache License 2.0](LICENSE). Copyright 2025-2026 Kalin Penchev.
