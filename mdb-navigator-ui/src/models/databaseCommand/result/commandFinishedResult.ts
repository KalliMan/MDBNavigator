export type CommandExecutionStatus = 'Completed' | 'Failed' | 'Cancelled';

// Sent by the server exactly once per streamed execution.
export interface CommandFinishedResult {
  executionId: string;
  status: CommandExecutionStatus;
  rowCount: number;
  recordsAffected: number;
  elapsedMs: number;
  // True when the server stopped at its row limit.
  truncated: boolean;
  error?: string | null;
}
