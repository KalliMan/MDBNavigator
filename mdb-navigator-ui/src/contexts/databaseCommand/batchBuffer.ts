import { DatabaseCommandBatchResult } from "../../models/databaseCommand/result/databaseCommandBatchResult";
import { DatabaseCommandActions, DatabaseCommandActionTypes } from "./DatabaseCommandActionType";

// Batches can arrive hundreds of times per second; the UI is updated at most this often.
const FLUSH_INTERVAL_MS = 150;

// Collects streamed batches and hands them to the reducer in groups,
// so a large result causes a few renders per second instead of one per batch.
export function createBatchBuffer(dispatch: React.Dispatch<DatabaseCommandActions>) {
  let queue: DatabaseCommandBatchResult[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;

  function flush() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (queue.length === 0) {
      return;
    }

    const batches = queue;
    queue = [];
    dispatch({ type: DatabaseCommandActionTypes.RowsAppended, payload: batches });
  }

  function push(batch: DatabaseCommandBatchResult) {
    queue.push(batch);

    if (!timer) {
      timer = setTimeout(flush, FLUSH_INTERVAL_MS);
    }
  }

  return { push, flush };
}

export type BatchBuffer = ReturnType<typeof createBatchBuffer>;
