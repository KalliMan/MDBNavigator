import { DatabaseCommandResultBase } from "./databaseCommandResultBase";
import { DatabaseCommandResultField } from "./databaseCommandResultField";

export interface DatabaseSingleCommandResult extends DatabaseCommandResultBase {
  recordsAffected: number;
  rowCount: number;
  fields: DatabaseCommandResultField[];
}