// Body of POST /databaseCommand. The run is identified only by executionId (unique per run); which tab
// it belongs to is known only to the UI.
export interface ExecuteQueryRequest {
  connectionId: string;
  databaseName: string;
  cmdQuery: string;
  executionId: string;
}
