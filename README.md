# MDBNavigator

A web-based database navigator: connect to a database server, browse its databases, tables, views, functions and procedures, generate scripts, and run SQL with results streamed into a virtualized grid.

<img width="2554" height="1232" alt="MDBNavigator: schema tree, SQL editor and result grid" src="https://github.com/user-attachments/assets/d18cbd99-07ab-432b-9002-b2d674b1cb65" />

**Supported servers:** PostgreSQL. The provider layer is pluggable (`IDbServerFactory`); MS SQL Server is planned but not implemented yet. Picking it in the connect dialog fails with "No provider registered".

> **Security status:** there is no user authentication yet. Anyone who can reach the API can use it to connect to any host the API server can reach. Run it only on `localhost` until authentication is in place (in progress).

## Features

- Several connections at once, each with a schema tree (databases, schemas, tables with columns and indexes, views, functions, procedures).
- Script generation: select the first N rows, `CREATE`, `INSERT` and `DROP` for tables, plus definitions and `CREATE`/`DROP` scripts for views, functions and procedures.
- SQL editor (Monaco) with PostgreSQL highlighting, one tab per query, all tabs kept open in the background.
- Streamed execution. Rows arrive over SignalR in batches while the query runs, and the grid shows them as they come. Multiple result sets, cancellation and a server-side row limit (100,000 rows by default) are supported.
- Virtualized result grid: only visible rows are rendered, so large results stay responsive.
- Clear errors: PostgreSQL `DETAIL` and `HINT` are included, for example which objects block a `DROP`.

## Repository layout

| Path | What it is |
|---|---|
| `MDBNavigator.Domain` | Entities, value objects (`ConnectionSettings`), enums, domain exceptions. No dependencies. |
| `MDBNavigator.Application` | Use cases as MediatR requests and handlers (`Features/...`), validators, DTOs, and the contracts the other layers implement (`IDatabaseProvider`, `IConnectionCache`, `IBatchNotifier`, ...). |
| `MDBNavigator.Infrastructure` | Implementations that don't depend on a database server: connection cache, background query queue and execution registry, SignalR hub and notifier. |
| `MDBNavigator.Infrastructure.PostgreSQL` | PostgreSQL provider (Npgsql + Dapper): schema queries, script generation, streaming, cell conversion (`JsonCellValue`), error descriptions. |
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

The UI calls the API over HTTPS, so trust the ASP.NET Core development certificate once:

```sh
dotnet dev-certs https --trust
```

Then run the `https` launch profile, either from Visual Studio or with:

```sh
dotnet run --project MDBNavigator.API --launch-profile https
```

The API listens on `https://localhost:3001` (and `http://localhost:3002`).

### 2. Start the UI

```sh
cd mdb-navigator-ui
npm ci
npm run dev
```

Open http://localhost:3000. To pre-fill the connect dialog during development, copy `.env.development.local.example` to `.env.development.local` and set your server and credentials. That file is git-ignored, and its values are never included in production builds.

### Production build (single origin)

In production the API serves the UI itself, so the browser talks to one origin and no CORS is involved:

1. `npm run build` in `mdb-navigator-ui`. `.env.production` uses relative URLs (`/api`, `/batchCommandResult`).
2. Copy the contents of `mdb-navigator-ui/dist` into `MDBNavigator.API/wwwroot`.
3. Run or publish the API. It serves `index.html` for `/` and for any client-side route that isn't an API or hub endpoint.

The API serves static files only when `wwwroot/index.html` exists, so in development (UI on the Vite dev server) it doesn't.

## Configuration

Settings live in `MDBNavigator.API/appsettings.json`. Any setting can be overridden with an environment variable, using `__` between section and key, for example `QueryExecution__MaxRowsPerExecution=50000`.

| Setting | Default | Meaning |
|---|---|---|
| `QueryExecution:BatchSize` | `500` | Rows per SignalR batch message. |
| `QueryExecution:CommandTimeoutSeconds` | `0` | Database command timeout. `0` means no timeout; long queries are stopped with the cancel endpoint. |
| `QueryExecution:MaxConcurrentQueries` | `8` | Background workers running streamed queries in parallel. Further runs wait in a queue. |
| `QueryExecution:MaxRowsPerExecution` | `100000` | Rows streamed per execution, across all result sets. When reached, the query is cancelled and the run reports `truncated: true`. `0` means unlimited. |
| `ConnectionCache:SlidingExpirationMinutes` | `480` | A connection's settings are dropped after this long without use, and the user has to reconnect. |

Environment variables read by the host:

| Variable | Meaning |
|---|---|
| `ASPNETCORE_ENVIRONMENT` | `Development` adds exception messages and stack traces to error responses. Any other value returns a generic message for unexpected errors. |
| `ASPNETCORE_URLS` | Addresses to listen on, for example `http://0.0.0.0:8080`. The launch profiles set these for local runs. |
| `ASPNETCORE_HTTPS_PORT` | When set, HTTP requests are redirected to HTTPS on this port. Leave it unset behind a TLS-terminating proxy; `X-Forwarded-Proto` and `X-Forwarded-For` are honoured. |

CORS allows only `http://localhost:3000` and `http://localhost:5173`, the Vite dev server origins (`Program.cs`). Production needs no CORS because the UI is served from the same origin.

**How connection credentials are kept.** Connection settings are held in server memory only, per browser tab and connection. The password is encrypted with a key that exists only in the running process. A restart drops every connection, and users reconnect.

## API

All endpoints are under `/api`, and every request must carry an `id` header with the client's session id. The UI generates one per browser tab and keeps it in `sessionStorage`. Connections, running queries and SignalR messages are scoped to that id. A request without exactly one `id` header gets `400`.

Errors are returned as JSON:

```json
{ "statusCode": 400, "message": "Connection failed: password authentication failed for user \"admin\"", "details": null }
```

`details` contains the stack trace in Development only. Database and validation errors are `400`, a missing object is `404`, and anything else is `500`.

| Method and path | Purpose |
|---|---|
| `POST databaseConnection/connect` | Body: `{ serverType, serverName, port, userName, password }`. Tests the connection and returns `{ connectionId, connectionName, serverName, port, serverType, userName }`. |
| `POST databaseConnection/reconnect/{connectionId}` | Same body. Replaces the settings for an existing connection id. |
| `POST databaseConnection/disconnect/{connectionId}` | Forgets the connection and cancels its running queries. |
| `GET databaseSchema/{databases\|tables\|storedProcedures\|functions\|views}/{connectionId}` | Schema objects. All except `databases` take `?database=`. |
| `GET databaseSchema/tableDefinition/{connectionId}?database=&schema=&table=` | Columns, indexes and constraints of a table. |
| `GET databaseCommand/{script}/{connectionId}?database=&schema=&...` | Generated SQL text: `tableRecordsScript`, `createTableScript`, `insertTableScript`, `procedureDefinition`, `viewDefinition`, and so on. Object names are always query parameters, never path segments. |
| `POST databaseCommand` | Starts a streamed query (see below). |
| `POST databaseCommand/cancel/{executionId}` | Cancels a run. Returns `204` whether or not the run still exists. |

### Streaming query results

Query results never travel in an HTTP response. They are pushed over a SignalR hub, which lets a large result render while it is still being read and lets the user cancel at any time.

**1. Connect to the hub** at `/batchCommandResult?applicationId={sessionId}`, using the same session id as the `id` header. The server sends only to that session's group, and clients never call the hub. Connect before starting a query, because messages sent while you are not connected are lost.

**2. Start the run.** The client generates a unique `executionId` and posts:

```http
POST /api/databaseCommand
id: {sessionId}
Content-Type: application/json

{ "connectionId": "...", "databaseName": "postgres", "cmdQuery": "select * from orders; select 1", "executionId": "{uuid}" }
```

The response is `202 Accepted` with `{ "id": "{executionId}" }`. The run is queued and starts once a worker is free.

**3. Receive `BatchCommandResult` messages**, zero or more per run:

```jsonc
{
  "id": "{executionId}_{resultSetIndex}",   // identifies the result set
  "executionId": "...",
  "resultSetIndex": 0,
  "index": 0,                               // batch number within the result set
  "isFirstBatch": true,
  "isLastBatch": false,
  "fields": [ { "index": 0, "fieldName": "order_id", "fieldType": "Int32", "fieldDataTypeName": "System.Int32" } ],
  "rows": [ [1, "2024-01-15T00:00:00", "199.90", null] ]
}
```

- `fields` is present only on the first batch of a result set.
- Every result set that returns columns ends with exactly one batch where `isLastBatch` is `true`. That batch can have no rows, which is how an empty result still delivers its columns. A result set can be a single batch that is both first and last.
- Statements that return no columns (`INSERT`, `UPDATE`, DDL) send no batches but still use up a `resultSetIndex`, so indexes can skip numbers.
- Batches of one run arrive in order.

**Cell values** are JSON values chosen so nothing is lost in JavaScript:

| Database value | JSON |
|---|---|
| `NULL` | `null` |
| integers up to 32 bits, finite floats | number |
| `bigint`, `numeric`/`decimal`, `NaN`/`Infinity` | string, because a JS number can't hold them exactly |
| `boolean` | boolean |
| dates, times, `uuid`, `text`, ... | string |
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
| `recordsAffected` | Rows changed by `INSERT`/`UPDATE`/`DELETE`, as reported by the provider. |
| `elapsedMs` | Time from when a worker started the run. Time spent waiting in the queue is not included. |
| `truncated` | `true` when the run stopped at `MaxRowsPerExecution`. The rows up to the limit were sent, and later result sets were not. |
| `error` | Message for `Failed` runs, including the server's detail and hint. Batches sent before the error stay valid. |

**Cancelling:** `POST /api/databaseCommand/cancel/{executionId}`. The outcome arrives as the run's `CommandFinished` with status `Cancelled`. Disconnecting a connection cancels all of its runs. Starting a run with an `executionId` that is already running cancels the earlier one.

**If the hub drops**, batches sent in the meantime are lost. A client should treat its running executions as failed and run them again once it has reconnected.

## Development

- Backend: `dotnet build MDBNavigator.sln`.
- UI: `npm run check` (type check plus type-aware ESLint with zero warnings allowed) and `npm run build` in `mdb-navigator-ui`.
- There are no automated tests yet. xUnit tests for the backend and Vitest tests for the UI are planned.

### Docker

The Dockerfiles and `docker-compose.yml` are out of date (for example, the API Dockerfile still copies projects that no longer exist) and will be reworked. Don't use them for now.

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md). Contributors need to sign the [Contributor License Agreement](CLA.md) before a pull request can be merged.

## License

Licensed under the [Apache License 2.0](LICENSE). Copyright 2025-2026 Kalin Penchev.
