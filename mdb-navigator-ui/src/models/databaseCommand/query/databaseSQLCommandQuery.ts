export interface DatabaseSQLCommandQuery {
  connectionId: string;
  id: string;
  name: string;
  databaseName: string;
  cmdQuery: string;
  executeImmediately: boolean;
  // Unique per streamed run; set right before execution.
  executionId?: string;
}
