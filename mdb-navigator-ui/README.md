# mdb-navigator-ui

The MDBNavigator web client: React 19, TypeScript and Vite. For the overall project, the API and the streaming contract, see the [root README](../README.md).

## Getting started

Prerequisites: Node.js 20 or later, and the API running from its `https` launch profile (see the root README).

```sh
npm ci
cp .env.development.local.example .env.development.local   # optional: pre-fills the connect dialog
npm run dev
```

The dev server runs on http://localhost:3000 with a fixed port. It proxies `/api` and `/batchCommandResult` (WebSockets included) to the API's HTTP port, `http://localhost:3002`, so the browser talks to one origin, exactly as in production, where the API serves the built UI. That is what lets the HttpOnly sign-in cookie work without any CORS setup. To point the proxy elsewhere, set `API_PROXY_TARGET`. `npm run dev` listens on all network interfaces (`--host 0.0.0.0`), so other machines on your network can open the page too.

**First run:** create an account on the sign-in page. Development sends no real email (`Email:Delivery = Log`): the confirmation link appears in the API's output (Visual Studio's Output window, or the console).

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server with hot reload. |
| `npm run build` | Type check (`tsc -b`), then a production build into `dist/`. |
| `npm run check` | Type check plus ESLint with `--max-warnings 0`. Run it, and `npm run build`, before committing. |
| `npm run lint` / `npm run lint:fix` | ESLint only, or with auto-fix. |
| `npm run typecheck` | `tsc -b` only. |
| `npm run preview` | Serves `dist/` on port 3000. |

## Environment variables

Vite reads `.env.development` for `npm run dev` and `.env.production` for `npm run build`. A `.local` variant of either file overrides it and is git-ignored.

| Variable | Used in | Meaning |
|---|---|---|
| `VITE_API_URL` | all builds | Base URL of the REST API, including `/api`. `/api` in development and production (same origin). |
| `VITE_SIGNALR_URL` | all builds | Origin of the SignalR hub; `/batchCommandResult` is appended. Empty in development and production, meaning the same origin. |
| `VITE_DEV_DB_SERVER`, `VITE_DEV_DB_PORT`, `VITE_DEV_DB_USER`, `VITE_DEV_DB_PASSWORD` | `npm run dev` only | Defaults for the connect dialog. Put them in `.env.development.local`. They are read only when `import.meta.env.DEV` is true, so production builds never contain them. |
| `API_PROXY_TARGET` | dev server only | Where the dev proxy sends API calls. Default `http://localhost:3002`. Not a `VITE_` variable, so it never reaches the browser bundle. |

The UI must be served from the API's origin: the sign-in cookie is `SameSite=Lax` and the API has no CORS policy. In production the API serves the built UI from its `wwwroot`.

New variables must also be declared in `src/vite-env.d.ts`.

## Source layout

| Folder | Contents |
|---|---|
| `src/Root.tsx` | The routes: the sign-in pages, or the workspace (`App.tsx`) at `/`. |
| `src/features` | Screens: sign-in pages (`auth/`), connect dialog, schema tree view with context menus, SQL editor with result view and status bar. |
| `src/contexts` | App state: one React context per area. `auth/` holds who is signed in; the others (server connections, database schema, query tabs, command execution) use reducers. |
| `src/services` | `apiAgent.ts`: axios setup, the tab `id` header, error toasts, the session-ended handling, and all REST calls. `authApi.ts`: the sign-in calls, on their own axios instance without toasts. `commandResultHub.ts`: the single SignalR connection and its status. |
| `src/models` | Types for what the API sends and receives. |
| `src/ui` | Reusable components with no app knowledge: `DataGrid`, `TreeView`, tabs, sidebars and splitters, modal, context menu, inputs. |
| `src/layout` | Top bar with the user menu, nav bar and main bar. |
| `src/common/sharedHooks`, `src/utils` | Shared hooks and helpers, such as the per-tab id in `localSessionStorage.ts` and error message extraction. |

## Sign-in in the UI

- On start, `AuthContextProvider` asks for `/api/auth/settings` (mode, sign-up, providers, email) and `/api/auth/me`. With `Auth:Mode = None` there are no sign-in pages, and the top bar says "Local mode".
- The workspace is mounted once someone signs in and then stays mounted, only hidden while another page shows. When the session ends, an API call gets 401, `apiAgent` tells the auth context, and the sign-in page appears. If the same user signs in again, every tab, query and result is still there. A different user, or Log out, reloads the page, so nothing of one user's workspace reaches another.
- Provider sign-in is a plain link to `/api/auth/external/{provider}`; the browser goes to the provider and comes back.
- The top bar sits above dialogs, so Log out stays reachable while the mandatory connect dialog is open.

## How a query runs in the UI

1. `useDatabaseCommandContext().executeDatabaseSQLCommand` generates a new `executionId`, which marks the tab as executing. It waits until the SignalR hub is connected, then posts the query. The server answers `202` right away.
2. `BatchCommandResult` messages go into `batchBuffer`. The buffer dispatches them to `DatabaseCommandReducer` in groups at most every 150 ms, so a large result causes a few renders per second rather than one per batch.
3. The reducer appends a batch only to the tab whose current `executionId` matches it. Late batches from a cancelled or replaced run are ignored.
4. `CommandFinished` first flushes the buffer, then sets the tab's status (`Completed`, `Failed` or `Cancelled`) and the stats shown in the status bar: row count, records affected, elapsed time, and whether the row limit was hit.
5. If the hub disconnects or starts reconnecting, running tabs are marked failed, because batches sent in the meantime are lost.

`DataGrid` virtualizes rows with `@tanstack/react-virtual`, and `formatCell` turns each `CellValue` into display text. Query tabs stay mounted when hidden, so switching tabs keeps the editor and results as they were.

## Conventions

- **`CellValue` has a server counterpart.** `src/models/databaseCommand/result/cellValue.ts` describes exactly what `MDBNavigator.Infrastructure.PostgreSQL/JsonCellValue.cs` produces. A change to one must be made in the other.
- **Lint is type-aware and strict.** `eslint.config.js` uses typescript-eslint's type-checked rules, and any warning fails `npm run check`.
- **Monaco is bundled locally, not loaded from a CDN.** `vite.config.ts` points the bare `monaco-editor` import at the editor core. This keeps Monaco's basic languages, including a second competing `pgsql`, out of the bundle. `src/features/databaseCommand/monacoSetup.ts` registers the PostgreSQL language from `monaco-sql-languages`.
- **Object names are query parameters.** Database, schema and table names go in `params` and are never put in the URL path, so names containing `/`, `?` or `#` are safe. Connection ids in the path go through `encodeURIComponent`.
