# Roadmap

What's planned for MDBNavigator, in order. Phases are done roughly in sequence, but a release doesn't wait for a whole phase: the project goes public after Phase 0 and a few Phase 1 items.

Size: **S** about a day, **M** a few days, **L** a week or more.

## Already done

Streamed query execution over SignalR (batches, cancellation, row limit, parallel workers), a virtualized result grid, a schema tree with script generation, PostgreSQL identifier quoting and readable errors, cached connection passwords that expire and are kept encrypted, same-origin production hosting, type-aware lint, .NET 10.

## Phase 0: Foundation

Needed before anything goes public. Each sub-phase is one reviewable step.

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
| **0.2b** Rate limiting | Limits on connecting and running queries, per user. | S |
| **0.2c** Security headers | Content Security Policy, HSTS and the usual headers. | S |

### 0.3 Tests

| Step | Contents | Size |
|---|---|---|
| **0.3a** UI unit tests (Vitest) | Reducers, `batchBuffer`, `formatCell`, the auth context. | S–M |
| **0.3b** Provider tests (xUnit) | PostgreSQL identifier quoting, generated scripts, `JsonCellValue`. | M |
| **0.3c** API tests (xUnit) | Handlers and the auth flows against a real Postgres. | M |

### 0.4 Docker

| Step | Contents | Size |
|---|---|---|
| **0.4a** Single image | The API serving the built UI, one multi-stage Dockerfile. Replaces both broken Dockerfiles. | M |
| **0.4b** Compose setup | The app with its `data` volume (SQLite), plus Postgres with a sample database. Runs with one command. | S |
| **0.4c** CI | GitHub Actions: build, lint, tests, image. | S–M |

### 0.5 Live demo

| Step | Contents | Size |
|---|---|---|
| **0.5a** Demo mode | Connections locked to the bundled sample database, through a read-only role with a statement timeout and a connection limit. The database is reset regularly. | M |
| **0.5b** Getting in | Decide how visitors get in without a sign-up wall, for example a guest option. | S–M |
| **0.5c** Hosting | Deploy and keep it running. | M |

### 0.6 Cleanups

| Step | Contents | Size |
|---|---|---|
| **0.6a** | Remove the stray root `package.json`/`package-lock.json`. | S |
| **0.6b** | Hide "MS SQL Server" in the connect dialog until its provider exists. | S |

## Phase 1: Basics

What users expect from any SQL tool. The UI refresh comes first, so the grid work and everything after it is built on the new look.

| Feature | Size | Notes |
|---|---|---|
| **Modern UI refresh** | L | A consistent design system: color, spacing and typography as Tailwind theme tokens, one icon set, restyled nav bar, tree, tabs, toolbar, dialogs and status bar, plus empty and loading states. Includes **dark mode**, which the tokens make cheap. Approach to decide first: our own Tailwind components, or a copy-in component library such as shadcn/ui. MIT-licensed dependencies only. |
| Grid: select and copy | M | Cells or rows, copied as TSV/CSV. |
| Grid: column resize, cell viewer | M | The cell viewer shows long text and JSON in full. |
| Grid: sort and filter | M | On the rows already loaded. |
| Export results | M | CSV and JSON. Respects the row limit, or streams the export on the server. |
| Error panel and error position | S–M | Long errors get their own panel. PostgreSQL reports where a query failed, so that spot is marked in the editor. |
| One tab per result set | M | Several result sets are currently hard to read. |
| Query history | S–M | Per connection. |
| Saved queries / snippets | S–M | |
| Autocomplete for table and column names | M–L | Uses the schema already loaded for the tree. |
| Auto-reconnect prompt | S | After the server restarts or a connection expires. |
| Accessibility | M | Keyboard navigation, screen reader support. |

## Phase 2: Standing out

| Feature | Size | Notes |
|---|---|---|
| EXPLAIN plan viewer | M | The query plan as a tree, with the expensive steps highlighted. |
| Edit table data in the grid | L | Generates `UPDATE`/`INSERT`/`DELETE` from the primary key, shows a preview, then applies it. |
| ER diagram | M–L | Built from the foreign keys. |
| Server activity view | M | Running sessions, cancel or kill a query, locks, table sizes (`pg_stat_activity` and related views). |
| AI assistant | M | Plain language to SQL, explain a query. Opt-in, using the user's own API key, because it sends the schema to a third party. |
| Import CSV into a table | M | |
| MS SQL Server provider | L | A second provider behind `IDbServerFactory`. |

## Phase 3: Team edition

Depending on demand.

| Feature | Size | Notes |
|---|---|---|
| Roles and permissions per connection | L | Including read-only users. |
| Shared connections stored on the server | L | Connections currently live only in memory. Storing passwords permanently needs proper encryption and key management. |
| Audit log | M | Who ran which query, and when. |
| Single sign-on (OpenID Connect) | M | |
| Query approval for production, masking sensitive columns | L | |
