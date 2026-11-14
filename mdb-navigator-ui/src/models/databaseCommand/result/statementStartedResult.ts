// Sent by the server before each statement of a run (SignalR "StatementStarted").
export interface StatementStartedResult {
  executionId: string;
  // Position in the script, from 0; the resultSetIndex of the statement's result set.
  statementIndex: number;
  statementCount: number;
  line: number;
}
