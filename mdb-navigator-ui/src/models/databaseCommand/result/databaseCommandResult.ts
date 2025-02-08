import { DatabaseCommandResultBase } from "./databaseCommandResultBase";
import { DatabaseCommandResultField } from "./databaseCommandResultField";

export interface DatabaseCommandResult extends DatabaseCommandResultBase {
  recordsAffected: number;
  rowCount: number;
  fields: DatabaseCommandResultField[];
}