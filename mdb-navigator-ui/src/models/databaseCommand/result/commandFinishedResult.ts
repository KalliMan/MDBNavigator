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
}
