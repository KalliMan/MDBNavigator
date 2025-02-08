import { DatabaseCommandResultBase } from "./databaseCommandResultBase";

export interface DatabaseCommandBatchResult extends DatabaseCommandResultBase {
  index: number;
}