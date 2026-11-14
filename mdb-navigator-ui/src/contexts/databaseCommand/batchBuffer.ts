import { DatabaseCommandBatchResult } from "../../models/databaseCommand/result/databaseCommandBatchResult";
import { StatementStartedResult } from "../../models/databaseCommand/result/statementStartedResult";
import { DatabaseCommandActions, DatabaseCommandActionTypes } from "./DatabaseCommandActionType";

// Batches can arrive hundreds of times per second; the UI is updated at most this often.
const FLUSH_INTERVAL_MS = 150;

// Collects streamed batches and hands them to the reducer in groups,
// so a large result causes a few renders per second instead of one per batch.
// StatementStarted messages go through the same buffer, and only the latest one per run is kept: a script of
// thousands of INSERTs sends thousands of them, and the status bar only needs the statement running now.
export function createBatchBuffer(dispatch: React.Dispatch<DatabaseCommandActions>) {
  let queue: DatabaseCommandBatchResult[] = [];
  let statements = new Map<string, StatementStartedResult>();
  let timer: ReturnType<typeof setTimeout> | null = null;

  function flush() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    // Rows first, so a result set is in the state before the statement after it is announced.
    if (queue.length > 0) {
      const batches = queue;
      queue = [];
      dispatch({ type: DatabaseCommandActionTypes.RowsAppended, payload: batches });
    }

    if (statements.size > 0) {
      const latest = statements;
      statements = new Map();
      latest.forEach(payload => dispatch({ type: DatabaseCommandActionTypes.StatementStarted, payload }));
    }
  }

  function startTimer() {
    if (!timer) {
      timer = setTimeout(flush, FLUSH_INTERVAL_MS);
    }
  }

  function push(batch: DatabaseCommandBatchResult) {
    queue.push(batch);
    startTimer();
  }

  function pushStatement(message: StatementStartedResult) {
    statements.set(message.executionId, message);
    startTimer();
  }

  return { push, pushStatement, flush };
}

export type BatchBuffer = ReturnType<typeof createBatchBuffer>;
