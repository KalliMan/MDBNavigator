import { DatabaseCommandResultBase } from "./databaseCommandResultBase";

export interface DatabaseCommandBatchResult extends DatabaseCommandResultBase {
  commandId: string;
  index: number;
}