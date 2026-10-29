import { CellValue } from "./cellValue";
import { DatabaseCommandResultField } from "./databaseCommandResultField";

// One batch of a streamed result set (SignalR "BatchCommandResult").
export interface DatabaseCommandBatchResult {
  // "{executionId}_{resultSetIndex}"
  id: string;
  executionId: string;
  index: number;
  resultSetIndex: number;
  isFirstBatch: boolean;
  isLastBatch: boolean;
  fields?: DatabaseCommandResultField[];
  rows: CellValue[][];
}
