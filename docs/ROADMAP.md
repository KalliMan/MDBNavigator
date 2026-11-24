# Roadmap

What's planned for MDBNavigator, in order. Phases are done roughly in sequence, but a release doesn't wait for a whole phase: the project goes public after Phase 0 and a few Phase 1 items.

Size: **S** about a day, **M** a few days, **L** a week or more.

## Already done

Streamed query execution over SignalR (batches, cancellation, row limit, parallel workers), a virtualized result grid, a schema tree with script generation, PostgreSQL identifier quoting and readable errors, cached connection passwords that expire and are kept encrypted, same-origin production hosting, type-aware lint, .NET 10.

## Phase 0: Foundation

Needed before anything goes public. Each sub-phase is one reviewable step. Phase 0 is done.

### 0.1 Authentication, part 1

Design: [specs/authentication.md](specs/authentication.md).

| Step | Contents | Size |
|---|---|---|
| **0.1a** Backend core | Accounts with ASP.NET Core Identity and EF Core in the app's own SQLite database (`ConnectionStrings:AppDb`), migrations at startup, Data Protection keys in the database, HttpOnly session cookie, the `/api/auth` endpoints and `me`, `Auth:Mode` (`Accounts` or `None`), `Auth:SignUp` (`Open` or `Closed`), seeded first admin, lockout, rate limiting on the auth endpoints. The API and the SignalR hub require sign-in; sessions become `userId:tabId`. | L |
| **0.1b** Social login | Google, Microsoft and GitHub, each switched on only when configured. An external login is linked to an existing account only when the provider has verified the email. | M |
| **0.1c** Email | Email confirmation and password reset over SMTP, only when SMTP is configured. | M |
| **0.1d** UI | `react-router`, a slim top bar with the user menu, the sign-in, create account, check inbox, email confirmed, forgot password and reset password pages, a return to sign-in on 401, the Vite dev proxy (same origin). | L |
| **0.1e** Account page | Change or set password, linked providers, delete account. | M |

### 0.2 Authentication, part 2

| Step | Contents | Size |
|---|---|---|
| **0.2a** Connection guardrails | Configurable: a public instance blocks private, loopback and cloud metadata addresses; self-hosted installs reach their private-network databases (off, or an allow-list). | M |
| **0.2b** Rate limiting | Limits on connecting and running queries, per user, including how many queries one user may run at once. Repeated failed connects lead to a short wait. | S–M |
| **0.2c** CAPTCHA | Optional, off by default: Cloudflare Turnstile or self-hosted ALTCHA (`Captcha:Provider`), on creating an account and after repeated failed connects. | M |
| **0.2d** Security headers | Content Security Policy (allowing Turnstile when it's used), HSTS and the usual headers. | S |

### 0.3 Tests

| Step | Contents | Size |
|---|---|---|
| **0.3a** UI unit tests (Vitest) | Reducers, `batchBuffer`, `formatCell` and the grid's other pure functions (Vitest, in Node). The auth context has no unit tests: it is glue around the API, whose sign-in flows the API tests cover, and testing it would need a DOM. Plan: [plans/0.3-test-gaps.md](plans/0.3-test-gaps.md). | S–M |
| **0.3b** Provider tests (xUnit) | PostgreSQL identifier quoting, the scripts built in C#, `JsonCellValue`, the script splitter. Plan: [plans/0.3-test-gaps.md](plans/0.3-test-gaps.md). | M |
| **0.3c** API tests (xUnit) | The API against a real PostgreSQL: sign-in, accounts, connections, schema, scripts with names that need quoting, queries, limits, saved connections, the demo, plus email confirmation, password reset, closed sign-up and lockout. Plan: [plans/0.3-test-gaps.md](plans/0.3-test-gaps.md). | M |

### 0.7 Modular structure

Numbered 0.7 because it was added later (2026-11-14), but done **before 0.4**: there is no production database to migrate yet, and the Dockerfile and CI are then written once, for the final layout.

Today one core project (`MDBNavigator.Application`) holds three unrelated problems, saved connections live in the accounts project, and the PostgreSQL provider references the whole core. The target is three modules, each about one problem, plus a small contract project for database providers:

```
src/
  Shared/     MDBNavigator.SharedKernel            handler interfaces, decorators, errors, session id
  Providers/  MDBNavigator.Providers.Abstractions  what a database provider must offer
              MDBNavigator.Providers.PostgreSQL
  Modules/
    Accounts/     MDBNavigator.Accounts                    sign-in, providers, email, account page
    Connections/  .Contracts  .Core  .Infrastructure       connect, guard, cache, saved connections
    Workbench/    .Core  .Infrastructure                   schema tree, scripts, running queries
  MDBNavigator.API
tests/
```

Rules: inside a module, Infrastructure → Core → Contracts → SharedKernel. Between modules only `.Contracts` (Workbench → Connections); nothing references Accounts. Providers reference only `Providers.Abstractions`. Accounts is one project, because it is almost entirely ASP.NET Core Identity wiring and a core would be nearly empty. Not part of this: the Result pattern with ProblemDetails (it changes the error contract with the UI), and minimal APIs instead of controllers.

| Step | Contents | Size |
|---|---|---|
| **0.7a** Build setup and layout | Projects move to `src/` and `tests/` under their current names. Shared build settings (`Directory.Build.props`, warnings are errors in Release), every NuGet version in `Directory.Packages.props`, a pinned SDK (`global.json`), `MDBNavigator.slnx`. No behavior change. Plan: [plans/0.7a-build-setup-layout.md](plans/0.7a-build-setup-layout.md). | S |
| **0.7b** API smoke tests | xUnit against the running app and a real PostgreSQL: sign in, connect, load the tree, run a query, saved connections. They show that the moves below change nothing (the first part of 0.3c). Plan: [plans/0.7b-api-smoke-tests.md](plans/0.7b-api-smoke-tests.md). | S–M |
| **0.7c** Provider contract | `MDBNavigator.Providers.Abstractions`: what a provider must offer, as three interfaces (read the schema, generate scripts, run queries) instead of one. The PostgreSQL provider references only it and becomes `MDBNavigator.Providers.PostgreSQL`. Plan: [plans/0.7c-provider-contract.md](plans/0.7c-provider-contract.md). | S–M |
| **0.7d** Own handler interfaces | `MDBNavigator.SharedKernel` with command and query handler interfaces, injected directly, and decorators for logging and validation. MediatR is removed (this was 0.6c). Plan: [plans/0.7d-handler-interfaces.md](plans/0.7d-handler-interfaces.md). | S–M |
| **0.7e** Connections module | Connect, reconnect and disconnect, the connection guard, the cache, the failed-connect wait, saved connections and remembered passwords, with its own database context. Deleting an account clears the user's data through an interface that each module implements, instead of the accounts code reaching into other tables. Plan: [plans/0.7e-connections-module.md](plans/0.7e-connections-module.md). | M |
| **0.7f** Workbench module | The schema tree, script generation, running and cancelling queries. The query run becomes a class of its own that can be tested without the queue. Plan: [plans/0.7f-workbench-module.md](plans/0.7f-workbench-module.md). | M |
| **0.7g** Accounts module | `MDBNavigator.Infrastructure.Accounts` becomes `MDBNavigator.Accounts`. What is left of `Application`, `Domain` and `Infrastructure` is removed. Also the dependency rules as a test (`tests/MDBNavigator.Architecture.Tests`). Plan: [plans/0.7g-accounts-module.md](plans/0.7g-accounts-module.md). | S |

### 0.4 Docker

| Step | Contents | Size |
|---|---|---|
| **0.4a** Single image | The API serving the built UI, one multi-stage Dockerfile. Replaces both broken Dockerfiles. Also: a setting for the proxies whose `X-Forwarded-*` headers are trusted (today only a proxy on the same machine is, so behind a proxy in another container every visitor counts as one IP and HSTS is not sent), and a health endpoint. Plan: [plans/0.4a-single-image.md](plans/0.4a-single-image.md). | M |
| **0.4b** Compose setup | The app with its `data` volume (SQLite), plus Postgres with a sample database (Pagila, and one table of about a million rows to show streaming and cancel). Runs with one command. With accounts and a seeded admin: `Auth:Mode = None` serves only requests from the same machine, which a browser outside the container is not. Plan: [plans/0.4b-compose.md](plans/0.4b-compose.md). | S |
| **0.4c** CI | GitHub Actions: build, lint, tests, image. Plan: [plans/0.4c-ci.md](plans/0.4c-ci.md). | S–M |

### 0.5 Live demo

| Step | Contents | Size |
|---|---|---|
| **0.5a** Demo database and limits | `compose.demo.yaml`: connections only to the bundled sample database, as a read-only role (`demo_reader`) that only the app's network may use; every other login is refused. The role's settings are put back when a guest changes them, its statements are logged, and the database has no way out to the internet. New run limits for every instance, off by default: time per run, rows per run, and bytes per row (larger values are cut). Container memory, CPU and log limits. No reset is needed: guests can't write. Plan: [plans/0.5a-demo-database-limits.md](plans/0.5a-demo-database-limits.md). | M |
| **0.5b1** Invite links and guests | Sign-up stays closed. An invite link with a secret code (changeable) opens a short form: name, email and the demo terms. A sign-in link by email starts a 10-minute guest session, already connected to the sample database; then the guest is signed out and the account deleted. Returning visitors sign in by email, up to 3 sessions a day; at most 10 guests at once. Guests get no account page. The owner gets an email for every new visitor. The visitor list is kept for 90 days after the last visit. Plan: [plans/0.5b1-guest-access.md](plans/0.5b1-guest-access.md). | L |
| **0.5b2** Violations and blocks | Refused actions in a guest session (permission errors, refused connections, limit hits; not mistakes like syntax errors) are counted: 20 end the session and block the visitor's email from the demo for 24 hours. No IP addresses are stored: a block is easy to get around with a VPN, and the demo's safety comes from the read-only database and the limits, not from blocks. The owner gets an email for every block. Plan: [plans/0.5b2-violations-blocks.md](plans/0.5b2-violations-blocks.md). | M |
| **0.5b3** Start page | With the demo on, visitors who aren't signed in see a public start page instead of the bare sign-in page: what MDBNavigator is, screenshots or a short video, the GitHub link, and "Try the demo" with the invite link, so a recruiter sees the project without signing up. Several invite codes, each with a name (to start with: LinkedIn, CV, Friends), instead of one: changing or removing one code stops only its links, and each visitor (and the owner's "new visitor" email) shows which link they came from. Plan: [plans/0.5b3-start-page-invite-codes.md](plans/0.5b3-start-page-invite-codes.md). | M |
| **0.5c** Hosting | The demo on a small server (Hetzner, 2 vCPU and 4 GB, in the EU) at `demo.mdbnavigator.com`, with `mdbnavigator.com` redirecting there for now: Caddy in `compose.demo.yaml` for HTTPS with Let's Encrypt, DNS at Cloudflare without its proxy, the mail records for sending through Brevo, the provider's firewall and SSH keys only, automatic security updates and a weekly rebuild with fresh base images, and an uptime monitor. Step by step: [hosting.md](hosting.md). Plan: [plans/0.5c-hosting.md](plans/0.5c-hosting.md). | M |

### 0.6 Cleanups

| Step | Contents | Size |
|---|---|---|
| **0.6a** | Remove the stray root `package.json`/`package-lock.json`. | S |
| **0.6b** | Hide "MS SQL Server" in the connect dialog until its provider exists. | S |
| **0.6c** | Replace MediatR with our own handler interfaces. Moved to 0.7d: the module split touches every handler anyway, and the smoke tests of 0.7b show that nothing changed. | S–M |
| **0.6d** | Provider sign-in and the sending of account emails come from the owner's NuGet package `Gatehouse.Accounts` instead of MDBNavigator's own copy. `Email:AppBaseUrl` is renamed to `Email:FrontendBaseUrl`. Plan: [plans/0.6d-gatehouse-accounts.md](plans/0.6d-gatehouse-accounts.md). | S |

## Phase 1: Basics

What users expect from any SQL tool. The UI refresh comes first, so the grid work and everything after it is built on the new look.

### First steps

| Step | Contents | Size |
|---|---|---|
| **1.1** UI refresh | A compact IDE look: light and dark theme as Tailwind color tokens, system fonts, a restyled top bar, connection tree, query tabs that show their server and database, a query bar with Run and Stop, a denser result grid and status bar. Each server has its own color. Plan: [plans/1.1-ui-refresh.md](plans/1.1-ui-refresh.md). | M |
| **1.2a** Saved connections: storage | Saved connections per user in the app database (name, server, port, default database, user, color), a CRUD API under `/api/savedConnections`. With `Auth:Mode = None` they belong to the local user. Plan: [plans/1.2a-saved-connections-storage.md](plans/1.2a-saved-connections-storage.md). | M |
| **1.2b** Saved connections: connect dialog | The saved list in the connect dialog: save, edit, delete, connect from a saved entry (password typed each time), a color picker. Plan: [plans/1.2b-saved-connections-dialog.md](plans/1.2b-saved-connections-dialog.md). | M |
| **1.2c** Remember password | Optional, encrypted with AES-GCM and a key from `SavedConnections:PasswordKey` (environment variable or user secrets). Only offered when the key is set. Plan: [plans/1.2c-remember-password.md](plans/1.2c-remember-password.md). | M |
| **1.2d** Switch server or database | Change a query tab's server or database from the query bar: menus with the connected servers and their databases. The editor text is kept, and the status bar says where the results came from. Plan: [plans/1.2d-switch-server-database.md](plans/1.2d-switch-server-database.md). | M |
| **1.3a** Result grid: select and copy | Select a range of cells, rows or columns (mouse and keyboard) and copy it as tab-separated text. Result columns carry a database-neutral type (`category`, `dataTypeName`). First unit tests (Vitest). Plan: [plans/1.3a-select-copy.md](plans/1.3a-select-copy.md). | M |
| **1.3b** Result grid: resize and cell viewer | Drag a header edge to resize a column, double-click it to fit; columns are virtualized too. Double-click a cell to see its full value, JSON formatted. Plan: [plans/1.3b-resize-cell-viewer.md](plans/1.3b-resize-cell-viewer.md). | M |
| **1.3c** Result grid: sort and filter | Sort by a column and filter across all columns, on the loaded rows. Plan: [plans/1.3c-sort-filter.md](plans/1.3c-sort-filter.md). | M |
| **1.3d** Result grid: tabs and export | One tab per result set, a Table or CSV view, and CSV and JSON download. Plan: [plans/1.3d-tabs-export.md](plans/1.3d-tabs-export.md). | M |
| **1.3e** Run scripts statement by statement | The server splits a script at its semicolons and runs the statements one after another, as psql does. The row limit counts per result set, a failing statement stops the script and is named with its line, and the status bar shows the running statement. First backend unit tests (xUnit). Plan: [plans/1.3e-run-statements-one-by-one.md](plans/1.3e-run-statements-one-by-one.md). | L |
| **1.4a** UI polish: visible defects | The tree shows short, calm column types; tab arrows only when the tabs don't fit; the editor starts at 40 % of the height; numbers are right-aligned and dates and times are written as PostgreSQL writes them; the connect dialog's wording and button order. Plan: [plans/1.4a-ui-fixes.md](plans/1.4a-ui-fixes.md). | M |
| **1.4b** UI polish: form controls | One style for inputs, selects, checkboxes, buttons and notices, used by the connect dialog, the account page and the sign-in pages. The connect dialog is tighter (Host and Port on one row), and the account page has the top bar. Plan: [plans/1.4b-form-controls.md](plans/1.4b-form-controls.md). | M |
| **1.4c** UI polish: surfaces and identity | Light theme tones that can be told apart, the tab's server and database first in the status bar, and empty states: no query open (with a New query button), no results yet, statements without rows, and an Error tab for a failed statement. Plan: [plans/1.4c-surfaces-empty-states.md](plans/1.4c-surfaces-empty-states.md). | S–M |

### Later

| Feature | Size | Notes |
|---|---|---|
| Error panel and error position | S–M | Long errors get their own panel. PostgreSQL reports where a query failed, so that spot is marked in the editor. |
| Messages panel | S–M | Per statement: rows affected, notices and timing. |
| Query history | S–M | Per connection. |
| Saved queries / snippets | S–M | |
| Autocomplete for table and column names | M–L | Uses the schema already loaded for the tree. |
| Auto-reconnect prompt | S | After the server restarts or a connection expires. |
| Accessibility | M | Keyboard navigation, screen reader support. |

## Phase 2: Standing out

| Feature | Size | Notes |
|---|---|---|
| **2.1** EXPLAIN plan viewer | M | The query plan as a tree, with the expensive steps highlighted. Explain (F7) and Explain Analyze (Shift+F7, rolled back), as an indented tree with expensive steps and bad row estimates marked. Plan: [plans/2.1-explain-plan-viewer.md](plans/2.1-explain-plan-viewer.md). |
| Edit table data in the grid | L | Generates `UPDATE`/`INSERT`/`DELETE` from the primary key, shows a preview, then applies it. |
| ER diagram | M–L | Built from the foreign keys. |
| Server activity view | M | Running sessions, cancel or kill a query, locks, table sizes (`pg_stat_activity` and related views). |
| AI assistant | M | Plain language to SQL, explain a query. Opt-in, using the user's own API key, because it sends the schema to a third party. |
| Import CSV into a table | M | |
| Copy a table between PostgreSQL databases | M | One table, to another server or database, started from a dialog. Rows go server to server with a bulk write, with progress and cancel. No type mapping needed, so it comes before the MS SQL provider. |
| MS SQL Server provider | L | A second provider behind `IDatabaseProvider`. |
| Copy a table across database types | M–L | SQL Server to PostgreSQL and back. Maps column types and shows the target table for review before anything is written. Needs the MS SQL provider. |
| Two-pane transfer view | M | A separate view with a connection tree on each side, to copy several tables from one side to the other. Not available in the read-only live demo. |

## Phase 3: Team edition

Depending on demand.

| Feature | Size | Notes |
|---|---|---|
| Roles and permissions per connection | L | Including read-only users and read-only connections (moved here from 1.2). |
| Shared connections stored on the server | L | Connections currently live only in memory. Storing passwords permanently needs proper encryption and key management. |
| Audit log | M | Who ran which query, and when. |
| Single sign-on (OpenID Connect) | M | |
| Query approval for production, masking sensitive columns | L | |
