import { DatabaseCommandResultBase } from "./databaseCommandResultBase";
import { DatabaseCommandResultField } from "./databaseCommandResultField";

export interface DatabaseCommandBatchResult extends DatabaseCommandResultBase {
  executionId: string;
  index: number;
  resultSetIndex: number;
  isFirstBatch: boolean;
  isLastBatch: boolean;
  fields?: DatabaseCommandResultField[];
}