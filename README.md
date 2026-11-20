# MDBNavigator

[![CI](https://github.com/KalliMan/MDBNavigator/actions/workflows/ci.yml/badge.svg)](https://github.com/KalliMan/MDBNavigator/actions/workflows/ci.yml)

A database client that runs in the browser: connect to a database server, browse its databases, tables, views, functions and procedures, generate scripts, and run SQL. Nothing to install on your machine.

**Query results stream into the grid while the query is still running**: the first rows show at once, even for a million-row result, and the run can be cancelled at any time.

## Screenshots

### Application view

<p align="center">
  <img width="2556" height="1228" alt="Application view" src="https://github.com/user-attachments/assets/19403bbf-c538-4aa2-8cfe-d26d84f1ab67" />
</p>

### Connection view

<p align="center">
  <img width="807" height="565" alt="Connection view" src="https://github.com/user-attachments/assets/32adf021-a4a4-4273-87d1-285ed8baa335" />
</p>

## Features

- **Streamed results.** Rows arrive over SignalR in batches while the query runs, into a virtualized grid that stays fast with large and wide results. Cancel at any time; a row limit per result set (100,000 by default) protects the browser.
- Scripts run statement by statement, as in psql. Each result set gets its own tab; a failing statement stops the script and gets an Error tab with its number and line.
- Several connections at once, each with a schema tree (databases, schemas, tables with columns and indexes, views, functions, procedures).
- Script generation: select the first N rows, `CREATE`, `INSERT` and `DROP` for tables, plus definitions and `CREATE`/`DROP` scripts for views, functions and procedures.
- SQL editor (Monaco) with PostgreSQL highlighting, one tab per query.
- Result grid: select and copy cells, rows or columns, resize columns, sort and filter, view a full value with JSON formatted, and export as CSV or JSON.
- Saved connections, optionally with a remembered password, encrypted on the server and never sent back to the browser.
- Each server has its own color, so it is clear where a query runs; a query tab can switch to another server or database.
- Accounts with email and password, optionally Google, Microsoft and GitHub.
- Light and dark theme, and clear errors with PostgreSQL's `DETAIL` and `HINT`.

**Supported servers:** PostgreSQL. The provider layer is pluggable; MS SQL Server is planned.

## Architecture

The backend is a modular monolith: one deployable API, three modules, each about one problem.

```
MDBNavigator.API ──► Accounts                  sign-in, providers, email, the account page
                 ├─► Connections               connect, guard, cache, saved connections
                 ├─► Workbench ──► Connections.Contracts
                 │                             schema tree, scripts, running queries
                 └─► Providers.PostgreSQL ──► Providers.Abstractions
```

- **Inside a module** dependencies point inward: Infrastructure → Core → Contracts → SharedKernel. Core holds the rules and names no web or database technology; Infrastructure holds the cache, SQLite, SignalR and the background workers.
- **Between modules** only a `Contracts` project is visible. The workbench opens a database through `IDatabaseConnector` and knows nothing else about connections. Nothing references Accounts: the other modules know a user only as the id in the session key.
- **A database provider** references only `Providers.Abstractions`. A second provider (MS SQL Server) is a new project next to the PostgreSQL one and one registration line.
- **A use case** is a command or a query with one handler (`ICommandHandler`, `IQueryHandler`). A controller action gets its handler injected; logging and validation are decorators around every handler. There is no mediator library.

`tests/MDBNavigator.Architecture.Tests` checks the project references against these rules.

## Tech stack

- **Backend:** .NET 10, ASP.NET Core, SignalR, Npgsql and Dapper, EF Core with SQLite, ASP.NET Core Identity, FluentValidation.
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, Monaco Editor with `monaco-sql-languages`, `@tanstack/react-virtual`, react-router, immer, axios, `@microsoft/signalr`, react-toastify, Vitest.

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
dotnet run --project src/MDBNavigator.API --launch-profile https
```

The API listens on `https://localhost:3001` and `http://localhost:3002`; the UI's dev server proxies to the latter. On first start it creates its SQLite database, `src/MDBNavigator.API/data/mdbnavigator.db` (git-ignored).

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
2. Copy the contents of `mdb-navigator-ui/dist` into `src/MDBNavigator.API/wwwroot`.
3. Run or publish the API. It serves `index.html` for `/` and for any client-side route that isn't an API or hub endpoint.

The Docker image does these three steps for you: see [Docker](#docker).

## Docker

One image holds the whole app: the API with the built UI in it.

```sh
docker build -t mdbnavigator:local .
docker run --rm -p 8080:8080 -v mdbnavigator-data:/app/data -e Auth__Admin__Email=you@example.com -e Auth__Admin__Password=change-this-password mdbnavigator:local
```

Open http://localhost:8080 and sign in with that account.

- **Data:** the app's SQLite database is in `/app/data`. Keep it in a volume, or accounts and saved connections are gone with the container.
- **Settings** are environment variables, with `__` between section and key (see [Configuration](#configuration)). Secrets such as `SavedConnections__PasswordKey` and `Auth__Admin__Password` belong there, never in the image.
- **HTTPS:** the container speaks plain HTTP on port 8080. Put a reverse proxy with TLS in front of it and set `ReverseProxy__TrustedNetworks__0` to the proxy's address or network. The sign-in cookie is `Secure`, so without HTTPS signing in works only on `http://localhost`.
- **Your databases:** inside the container, `localhost` is the container itself. To reach a PostgreSQL on the Docker host use `host.docker.internal`, and with open sign-up allow it (see [connection guardrails](docs/security.md#connection-guardrails)).
- **Health:** `GET /health` answers `200 Healthy` when the app's own database is reachable, for a proxy or an uptime monitor.
- **`Auth:Mode = None` is not for containers:** it serves only requests from the same machine, and your browser is outside the container.
- The image runs as a non-root user.

### With Compose

To try the app with a database to look at:

```sh
docker compose up --build
```

The first start builds the two images and loads the sample data, which takes a few minutes. Then open http://localhost:8080 and sign in as `admin@example.com` with the password `change-this-password`.

Connect to the bundled PostgreSQL:

| Field | Value |
|---|---|
| Host | `sample-db` |
| Port | `5432` |
| User | `sample` |
| Password | `sample` |
| Database | `pagila` |

- **Pagila** is PostgreSQL's usual sample: a DVD rental shop with about 20 tables, views and functions.
- **`demo.measurements`** has a million rows. `select * from demo.measurements` shows rows arriving while the query runs, the row limit, and Cancel.
- **Your own databases** on this machine are at the host `host.docker.internal`.
- **Settings:** copy `.env.example` to `.env` to change the admin's email and password, the port, or to set a key so saved connections can remember passwords.
- **Starting over:** `docker compose down -v` removes the app's data and the sample database; the next `up` creates both again.
- **Read-only user:** `demo_reader` (password `demo-reader`, or `MDBNAV_DEMO_READER_PASSWORD` in `.env`) may only read the sample data, as guests of the public demo do. It is created with the sample database, so an existing setup gets it after `docker compose down -v`.

This setup is for one machine: the port is open to `localhost` only, there is no HTTPS, and the password has a default. Before opening it to anyone else, set your own password in `.env` and put a reverse proxy with TLS in front (see `ReverseProxy:TrustedNetworks`).

### Public demo setup

```sh
docker compose -f docker-compose.yml -f compose.demo.yaml up -d --build
```

The same two services, locked down for strangers, plus Caddy in front for HTTPS: connections only to the sample database as `demo_reader`, which only the app may use, run limits, the database on an internal network, container and log limits. Caddy gets the certificate for `MDBNAV_DOMAIN` (e.g. `demo.example.com`) from Let's Encrypt and redirects HTTP, and the other names in `MDBNAV_REDIRECT_DOMAINS` (by default `www.` in front of it), to it, so the server's ports 80 and 443 must be open and every one of those names must point at it in DNS. What it does and why: [public demo](docs/security.md#public-demo). Running it on a server, step by step (server, DNS and mail records, updates, monitoring): [docs/hosting.md](docs/hosting.md).

Guests get in by invitation: send someone `https://<your address>/?code=<invite code>`. It opens a start page (what MDBNavigator is, with screenshots) whose "Try the demo" button leads on. Visitors give their name and email and agree to the demo terms, get a sign-in link by email, and press Start for a 10-minute session that is already connected to the sample database. When the time is up they are signed out and the session's account is deleted. Returning visitors ask for a new link at `/demo/sign-in`. You get an email for every new visitor, naming the link they came by.

Before the first start, set the `MDBNAV_DEMO_*` (an invite code each in `MDBNAV_DEMO_CODE_LINKEDIN`, `MDBNAV_DEMO_CODE_CV` and `MDBNAV_DEMO_CODE_FRIENDS`, at least one; a blank one switches that link off), `MDBNAV_DOMAIN`, `MDBNAV_EMAIL_FROM` and `MDBNAV_SMTP_*` values in `.env` (see `.env.example`); Compose refuses to start without them. To try it on your own machine, use `MDBNAV_DOMAIN=localhost`: Caddy then uses a certificate of its own, which the browser warns about once.

To try the demo while developing, put the `Demo` settings (all but `Enabled`) in the API's user secrets and start the **https-demo** launch profile: it is the `https` profile with `Demo__Enabled=true`, so the usual profile stays without the demo. In Development, emails go to the log unless `Email:Delivery` says otherwise.

## Configuration

Settings live in `src/MDBNavigator.API/appsettings.json`. Any setting can be overridden with an environment variable, using `__` between section and key, for example `QueryExecution__MaxRowsPerResultSet=50000`.

| Setting | Default | Meaning |
|---|---|---|
| `QueryExecution:BatchSize` | `500` | Rows per SignalR batch message. |
| `QueryExecution:CommandTimeoutSeconds` | `0` | Database command timeout, per statement. `0` means no timeout; long queries are stopped with the cancel endpoint. |
| `QueryExecution:MaxConcurrentQueries` | `8` | Background workers running streamed queries in parallel. Further runs wait in a queue. |
| `QueryExecution:MaxRowsPerResultSet` | `100000` | Rows streamed per result set. A longer result stops there and is marked `truncated`; the rest of the script still runs. `0` means unlimited. See [how a script runs](docs/api.md#how-a-script-runs). |
| `QueryExecution:MaxRunSeconds` | `0` | Longest a run may take; a longer run stops with an error. Unlike `CommandTimeoutSeconds`, SQL can't switch it off. `0` means no limit. |
| `QueryExecution:MaxRowsPerRun` | `0` | Rows streamed per run, over all its result sets. A run that goes past it stops with an error, and the rest of the script is not run. `0` means unlimited. |
| `QueryExecution:MaxRowBytes` | `0` | Bytes of values read per row. A value that would take a row past it is cut: text and JSON keep their first 1,000 characters, anything else shows only its size. Values of 1 KB or less are never cut. `0` means unlimited. See [how a script runs](docs/api.md#how-a-script-runs). |
| `ConnectionCache:SlidingExpirationMinutes` | `480` | A connection's settings are dropped after this long without use, and the user has to reconnect. |
| `Auth:Mode` | `Accounts` | `Accounts`: sign-in required. `None`: no sign-in; only requests from the local machine are served, and saved connections belong to one local user. Connections saved in one mode don't show up in the other. |
| `Auth:SignUp` | `Open` | `Closed`: nobody can create an account; the first admin comes from `Auth:Admin`. |
| `Auth:Admin:Email`, `Auth:Admin:Password` | | The first admin, created at startup if it doesn't exist. Put them in user secrets or environment variables. |
| `ConnectionStrings:AppDb` | `Data Source=data/mdbnavigator.db` | The app's own SQLite database (accounts, saved connections; used in both auth modes). A relative path is taken from the app's folder. Keep it on a persistent local disk; in Docker, mount the `data` folder as a volume. |
| `SavedConnections:PasswordKey` | | 32 random bytes in base64 (`openssl rand -base64 32`). When set, saved connections can remember passwords. A secret: user secrets or an environment variable. See [remembered passwords](docs/security.md#remembered-passwords). |
| `Authentication:{Google\|Microsoft\|GitHub}:ClientId`, `ClientSecret` | | Sign-in with that provider, switched on when both are set (user secrets or environment variables). The provider's app must allow the return address `https://{host}/api/auth/signin-google` (or `-microsoft`, `-github`). |
| `Email:Delivery` | `None` | `Smtp` turns on email confirmation and password reset; `Log` (Development only) writes the emails to the log instead. Also needs `Email:AppBaseUrl` (the app's address for links), and for SMTP `Email:FromAddress`, `Email:Smtp:Username` and `Email:Smtp:Password`. `Email:Smtp:Host` and `Port` default to Brevo (`smtp-relay.brevo.com`, 587); set them only for another mail server. See the [spec](docs/specs/authentication.md) for what changes for existing accounts. |
| `RateLimiting:*` | | Limits on sign-in requests, connects and query runs, and the wait after failed connects. See [rate limits](docs/security.md#rate-limits-and-captcha). |
| `Captcha:Provider` | `None` | `Turnstile` (Cloudflare) or `Altcha` (self-hosted) asks for a CAPTCHA when creating an account and after repeated failed connects. See [CAPTCHA](docs/security.md#rate-limits-and-captcha). |
| `ConnectionGuard:Mode`, `Allow` | from `Auth` | Which database hosts users may connect to: `Public`, `AllowList` or `Off`. See [connection guardrails](docs/security.md#connection-guardrails). |
| `Demo:Enabled` | `false` | Invited guests try the app in short sessions, connected to a sample database. Needs `Auth:Mode = Accounts`, email, and the `Demo` settings below; the app doesn't start without them. See [public demo](docs/security.md#public-demo). |
| `Demo:InviteCodes` | | Invite links' secrets, each with a name: a list of `Name` and `Code` (at least 16 characters; empty switches that link off). Share `https://<your address>/?code=<code>`. Changing a code stops only its links. Secrets: user secrets or environment variables (`Demo__InviteCodes__0__Name`, `Demo__InviteCodes__0__Code`, ...). |
| `Demo:OwnerEmail`, `Demo:ContactEmail` | | Who gets an email for every new visitor and every block; the address in the demo terms for deletion requests. |
| `Demo:SessionMinutes` | `10` | Length of a guest session (1–120). |
| `Demo:SessionsPerVisitorPerDay`, `MaxActiveGuests`, `SessionsPerIpPerHour` | `3`, `10`, `3` | Sessions per visitor within 24 hours, guests at once, and sessions started from one IP address within an hour. |
| `Demo:LinkEmailsPerAddressPerHour`, `LinkRequestsPerIpPerHour`, `LinkValidMinutes` | `3`, `10`, `30` | Sign-in link emails per address and hour (more are silently not sent), link requests per IP address and hour, and how long a link works. |
| `Demo:ViolationsBeforeBlock`, `BlockHours` | `20`, `24` | Refused actions (permission errors, refused connections, limits reached) in one guest session before it ends and the visitor's email is blocked from the demo, and how long the block lasts (1–168 hours). See [violations and blocks](docs/security.md#public-demo). |
| `Demo:Connection:Name`, `ServerName`, `Port`, `UserName`, `Password`, `DatabaseName` | | The PostgreSQL database guests are connected to, and its name in the UI. The server connects them itself, so the password never reaches the browser. `Password` is a secret. |
| `ReverseProxy:TrustedNetworks` | | The proxies in front of the app, as IP addresses or ranges (`172.16.0.0/12`). Only their `X-Forwarded-For` and `X-Forwarded-Proto` are believed; with the list empty, only a proxy on the same machine. Needed when the proxy runs in another container or host: without it every visitor shares the proxy's address (and its rate limit), and HSTS is not sent. |

Environment variables read by the host:

| Variable | Meaning |
|---|---|
| `ASPNETCORE_ENVIRONMENT` | `Development` adds exception messages and stack traces to error responses. Any other value returns a generic message for unexpected errors. |
| `ASPNETCORE_URLS` | Addresses to listen on, for example `http://0.0.0.0:8080`. The launch profiles set these for local runs. |
| `ASPNETCORE_HTTPS_PORT` | When set, HTTP requests are redirected to HTTPS on this port, except in Development, where the UI's dev proxy uses the HTTP port. Leave it unset behind a TLS-terminating proxy. |

## Security

The server opens database connections for its users, so an instance with open sign-up is protected in several ways. Details in [docs/security.md](docs/security.md).

- **Sign-in** with accounts; each user's connections and results are separate ([design](docs/specs/authentication.md)).
- **Connection guardrails:** with open sign-up, the server's own network (localhost, private ranges, cloud metadata) can't be reached.
- **Rate limits** on connecting and running queries, per user, and an optional CAPTCHA on sign-up and after repeated failed connects.
- **Run limits** for public instances: time and rows per run, and a size limit per row, so one query can't hold a worker or fill the server's memory. The [public demo setup](docs/security.md#public-demo) uses them with a read-only database user.
- **Demo guests** come in by invitation and an emailed link, for 10-minute sessions in throwaway accounts, with limits per visitor, per address and in total.
- **Passwords** of saved connections are remembered only when a key is configured, encrypted with AES-GCM and never sent back to the browser.
- **Security headers,** including a Content Security Policy.

## API

All endpoints are under `/api` and need sign-in plus an `id` header with the browser tab's id. Query results don't come in the HTTP response: they are pushed over the SignalR hub `/batchCommandResult` in batches, followed by one `CommandFinished` message. The endpoints, the error format and the streaming contract are in [docs/api.md](docs/api.md).

## Development

- Backend: `dotnet build MDBNavigator.slnx`. A Release build (`-c Release`) treats warnings as errors. Package versions are set in `Directory.Packages.props` only.
- Tests: `dotnet test MDBNavigator.slnx` runs the backend's tests (xUnit): unit tests of the PostgreSQL provider, API smoke tests against PostgreSQL in a throwaway container (they need Docker running), and the architecture tests. `npm test` in `mdb-navigator-ui` runs the UI's unit tests (Vitest).
- UI: `npm run check` (type check plus type-aware ESLint with zero warnings allowed) and `npm run build` in `mdb-navigator-ui`.
- CI (GitHub Actions, `.github/workflows/ci.yml`) runs all of the above on every push and pull request, and builds and starts the Docker images.

## Repository layout

| Path | What it is |
|---|---|
| `src/Shared/MDBNavigator.SharedKernel` | Handler interfaces with their logging and validation decorators, the common errors, the session key. |
| `src/Providers/MDBNavigator.Providers.Abstractions` | What a database provider must offer, and the types that cross between the app and a provider. No dependencies. |
| `src/Providers/MDBNavigator.Providers.PostgreSQL` | PostgreSQL provider (Npgsql + Dapper): schema queries, script generation, streaming, cell values, error descriptions. |
| `src/Modules/Accounts/MDBNavigator.Accounts` | Accounts in the app's SQLite database: ASP.NET Core Identity, external sign-in, email, the account page. |
| `src/Modules/Connections/MDBNavigator.Connections.*` | Connect and disconnect, the connection guard and cache, saved connections and remembered passwords (`Contracts`, `Core`, `Infrastructure`). |
| `src/Modules/Workbench/MDBNavigator.Workbench.*` | The schema tree, script generation, running and cancelling queries, the SignalR hub (`Core`, `Infrastructure`). |
| `src/MDBNavigator.API` | ASP.NET Core host: controllers, middleware, rate limits, CAPTCHA, security headers. Wires the modules together and serves the built UI in production. |
| `tests/` | Provider unit tests, API smoke tests, architecture tests (xUnit). |
| `mdb-navigator-ui` | React + TypeScript + Vite single-page app. See [its README](mdb-navigator-ui/README.md). |
| `docs/` | [API](docs/api.md), [security](docs/security.md), [specs](docs/specs), [roadmap](docs/ROADMAP.md) and implementation plans. |
| `Dockerfile`, `docker-compose.yml`, `docker/sample-db` | The app as one image, and a local try-out with sample data. |
| `Directory.Build.props`, `Directory.Packages.props`, `global.json` | Shared build settings, NuGet package versions, the .NET SDK version. |

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md). Contributors need to sign the [Contributor License Agreement](CLA.md) before a pull request can be merged.

## License

Licensed under the [Apache License 2.0](LICENSE). Copyright 2025-2026 Kalin Penchev.
