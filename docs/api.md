# API

The HTTP endpoints, the error format, and the contract for streamed query results. For running the app and its settings, see the [README](../README.md).

- [Endpoints](#endpoints)
- [Streaming query results](#streaming-query-results)
- [How a script runs](#how-a-script-runs)

## Endpoints

All endpoints are under `/api`. With `Auth:Mode = Accounts` they require sign-in (the `mdbnav_session` cookie from `POST /api/auth/login?useCookies=true`); a request without it gets `401`. Every request must also carry an `id` header with the client's tab id. The UI generates one per browser tab and keeps it in `sessionStorage`. Connections, running queries and SignalR messages are scoped to the session `{userId}:{tabId}`, so a tab id alone never reaches another user's data. A request without exactly one `id` header gets `400`. [`MDBNavigator.API.http`](../src/MDBNavigator.API/MDBNavigator.API.http) has sample requests.

Sign-in endpoints (`/api/auth`): `settings` (anonymous: mode, sign-up, providers, email, CAPTCHA provider and Turnstile site key, and `demo`: `{ contactEmail, sessionMinutes, connectionName, violationsBeforeBlock, blockHours }` or `null`), `register`, `login`, `logout`, `me`, `external/{provider}`, the signed-in user's own `account` (password, linked providers, deletion), plus Identity's `confirmEmail`, `resendConfirmationEmail`, `forgotPassword`, `resetPassword` and `manage/info`. See the [authentication spec](specs/authentication.md).

For a demo guest, `me` also returns `guest: { name, endsAtUtc, secondsLeft }` (otherwise `null`; the guest's `email` is made up), `logout` ends the session for good and deletes the guest's account at once, and `account/*` and `manage/*` answer `403`.

Demo endpoints (`/api/demo`, anonymous, only with `Demo:Enabled`; otherwise `404`). They don't need the `id` header:

| Method and path | Purpose |
|---|---|
| `POST demo/join` | The invite form. Body: `{ inviteCode, name, email, termsVersion }`, plus a `Captcha-Token` header when a CAPTCHA is set. `204` once the link is on its way, and also when the address has had its hourly number of links or belongs to a blocked visitor (then nothing is sent). `403` when the code matches none of `Demo:InviteCodes`; `400` with error codes `InvalidName`, `InvalidEmail`, `TermsNotAccepted` or `TermsChanged` (the UI showed an older text). Rate limited per IP address and hour. |
| `POST demo/sign-in-link` | A returning visitor asks for a new link. Body: `{ email, termsVersion }`, plus `Captcha-Token`. Always `204` for a valid request: an address that has never used a link, or a blocked visitor's, gets no email, and the answer doesn't say so. |
| `POST demo/start` | Body: `{ token }` from the emailed link. Signs the browser in as a new guest (the session cookie, for `Demo:SessionMinutes`). `204`; `400` when the link is unknown, used or expired; `403` "Demo access is paused for 24 hours after too many refused actions." for a blocked visitor; `429` with a message when the visitor has used today's sessions, the demo is full, or too many sessions started from the address within the hour. A refused start doesn't use up the link. |
| `POST demo/connect` | Guests only (`403` otherwise), with the `id` header. Opens the guest's connection to the demo database with the server's own settings and returns the same as `databaseConnection/connect`, with `connectionName` from `Demo:Connection:Name`. |

Errors are returned as JSON:

```json
{ "statusCode": 400, "message": "Connection failed: password authentication failed for user \"admin\"", "details": null }
```

`details` contains the stack trace in Development only. Database and validation errors are `400`, a missing object is `404`, a conflict with stored data (a saved connection name already taken, the list full) is `409`, a [rate limit](security.md#rate-limits-and-captcha) is `429`, a missing or invalid CAPTCHA is `428`, and anything else is `500`.

| Method and path | Purpose |
|---|---|
| `POST databaseConnection/connect` | Body: `{ serverType, serverName, port, userName, password, databaseName?, savedConnectionId? }`. Tests the connection and returns `{ connectionId, connectionName, serverName, port, serverType, userName, databaseName, savedConnectionId }`. `databaseName` is opened whenever a request names no database (the connect test, the database list); without it, the server's default (PostgreSQL: the database named like the user). With an empty `password` and a `savedConnectionId`, the saved connection's [remembered password](security.md#remembered-passwords) is used (same server, port and user only; otherwise `400`); the result then carries that `savedConnectionId`, so a reconnect can send it again. After repeated failed connects, needs a `Captcha-Token` header when a CAPTCHA is set. |
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
| `GET /health` | Outside `/api`, anonymous: `200 Healthy` when the app's own database is reachable. |

## Streaming query results

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

Add `"plan": "Estimate"` or `"plan": "Analyze"` to get the plan of one statement instead of running the script. The provider puts `EXPLAIN (FORMAT JSON)` (or `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`) in front of it. With `Analyze` the statement really runs, inside a transaction that is rolled back. The run then sends one `StatementStarted` and one result set: a single batch with one column `QUERY PLAN` (category `Json`) and one row, whose value is EXPLAIN's JSON as a string. A script that isn't exactly one statement, an `EXPLAIN` statement, or a plan larger than `MaxRowBytes` ends with `CommandFinished` `Failed` and a message. An unknown `plan` value is a `400`.

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
- A batch has up to `BatchSize` rows, fewer when its values add up to about 1 MB, so a result with wide rows comes in smaller messages.
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

**Cut values:** with `MaxRowBytes` set, a value that would take its row past that many bytes arrives as a string: text and JSON as their first 1,000 characters followed by `… [cut: 196 KB in total]`, anything else as `[too large to show: 98 KB]`. Values of 1 KB or less are never cut. The size is the value's size as the database sent it. This is `CutCellText.cs`.

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
| `error` | Message for `Failed` runs, including the server's detail and hint. For a script with several statements it starts with the failing one: `Statement 2 of 5 (line 14): ...`. Batches sent before the error stay valid. A run stopped by one of the server's run limits is also `Failed`, with the reason: `Stopped after 60 seconds, this server's time limit for one run.` or `Stopped after more than 50,000 rows in total, this server's row limit for one run; the rest of the script was not run.` |

**Cancelling:** `POST /api/databaseCommand/cancel/{executionId}`. The outcome arrives as the run's `CommandFinished` with status `Cancelled`. Disconnecting a connection cancels all of its runs. Starting a run with an `executionId` that is already running cancels the earlier one.

**If the hub drops**, batches sent in the meantime are lost. A client should treat its running executions as failed and run them again once it has reconnected.

## How a script runs

The server splits the script into statements at its semicolons and runs them one after another on one connection, opened for the run. This is what psql does.

- **Splitting** follows psql's rules: a semicolon inside a string, a quoted identifier, dollar-quoted text, a comment, parentheses or a `BEGIN ATOMIC ... END` function body does not split. psql's backslash commands are not supported.
- **Each statement commits on its own.** To make several statements all-or-nothing, put them between `BEGIN` and `COMMIT`; a long data script is also much faster that way. A transaction still open when the script ends is rolled back, because the connection is closed.
- **The first failing statement stops the script.** Earlier statements keep their results and, outside a transaction, their changes.
- **The row limit counts per result set.** A statement that only reads (`SELECT`, `TABLE`, `VALUES`, `WITH` or `SHOW`, without `INSERT`, `UPDATE`, `DELETE` or `MERGE` in it) and runs outside a transaction is cancelled at the limit, which is immediate. Any other statement is read to its end with the remaining rows thrown away, because cancelling it would undo its changes or abort the open transaction. For a very large result that takes a while; the run can be cancelled as usual.
- **Run limits**, off unless set: `MaxRunSeconds` stops a run that takes longer, and `MaxRowsPerRun` stops it once more than that many rows have been streamed (the batch that crosses the limit is still sent). Both stop the statement in the database at once, like Cancel, and end the run as `Failed` with the reason. A run that is stopped (by a limit or by Cancel) between two statements doesn't start the next one.
- A `SELECT` that calls a function which changes data, and returns more rows than the limit, is cancelled like any other `SELECT`, and the function's changes are undone. Run it between `BEGIN` and `COMMIT` to have it read to the end.

The splitter and these rules are `PostgresScriptSplitter` and `PostgresStatementRules` in the PostgreSQL provider, with unit tests.
