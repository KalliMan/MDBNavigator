# mdb-navigator-ui

The MDBNavigator web client: React 19, TypeScript and Vite. For the overall project, the API and the streaming contract, see the [root README](../README.md).

## Getting started

Prerequisites: Node.js 20 or later, and the API running on `https://localhost:3001` (see the root README). The browser calls the API over HTTPS, so the .NET development certificate must be trusted (`dotnet dev-certs https --trust`).

```sh
npm ci
cp .env.development.local.example .env.development.local   # optional: pre-fills the connect dialog
npm run dev
```

The dev server runs on http://localhost:3000 with a fixed port. The API's CORS policy allows this origin and `5173`. `npm run dev` listens on all network interfaces (`--host 0.0.0.0`), so other machines on your network can open the page too.

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
| `VITE_API_URL` | all builds | Base URL of the REST API, including `/api`. Development: `https://localhost:3001/api`. Production: `/api`. |
| `VITE_SIGNALR_URL` | all builds | Origin of the SignalR hub; `/batchCommandResult` is appended. Development: `https://localhost:3001`. Production: empty, meaning the same origin. |
| `VITE_DEV_DB_SERVER`, `VITE_DEV_DB_PORT`, `VITE_DEV_DB_USER`, `VITE_DEV_DB_PASSWORD` | `npm run dev` only | Defaults for the connect dialog. Put them in `.env.development.local`. They are read only when `import.meta.env.DEV` is true, so production builds never contain them. |

The production values assume the API serves the built UI from its `wwwroot`. If the UI is hosted elsewhere, set both URLs to the API's absolute address at build time, and add the UI's origin to the API's CORS policy.

New variables must also be declared in `src/vite-env.d.ts`.

## Source layout

| Folder | Contents |
|---|---|
| `src/features` | Screens: connect dialog, schema tree view with context menus, SQL editor with result view and status bar. |
| `src/contexts` | App state: one React context with a reducer per area (server connections, database schema, query tabs, command execution). |
| `src/services` | `apiAgent.ts`: axios setup, the session `id` header, error toasts, and all REST calls. `commandResultHub.ts`: the single SignalR connection and its status. |
| `src/models` | Types for what the API sends and receives. |
| `src/ui` | Reusable components with no app knowledge: `DataGrid`, `TreeView`, tabs, sidebars and splitters, modal, context menu, inputs. |
| `src/layout` | Nav bar and main bar. |
| `src/common/sharedHooks`, `src/utils` | Shared hooks and helpers, such as the per-tab session id in `localSessionStorage.ts` and error message extraction. |

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
