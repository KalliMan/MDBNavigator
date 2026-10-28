export type CommandExecutionStatus = 'Completed' | 'Failed' | 'Cancelled';

// Sent by the server exactly once per streamed execution.
export interface CommandFinishedResult {
  commandId: string;
  executionId: string;
  status: CommandExecutionStatus;
  rowCount: number;
  recordsAffected: number;
  elapsedMs: number;
  error?: string | null;
}
