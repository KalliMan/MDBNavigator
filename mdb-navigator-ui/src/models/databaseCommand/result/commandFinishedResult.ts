export type CommandExecutionStatus = 'Completed' | 'Failed' | 'Cancelled';

// Sent by the server exactly once per streamed execution.
export interface CommandFinishedResult {
  executionId: string;
  status: CommandExecutionStatus;
  rowCount: number;
  recordsAffected: number;
  elapsedMs: number;
  // True when at least one result set stopped at the server's row limit.
  truncated: boolean;
  error?: string | null;
  // A failed run: the index in the sent script (UTF-16 units, as a JS string counts) of the place the database
  // reported; null or absent when it gave none.
  errorOffset?: number | null;
}
