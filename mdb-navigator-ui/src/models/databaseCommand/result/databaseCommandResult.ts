import { DatabaseSingleCommandResult } from "./databaseSingleCommandResult";

export interface DatabaseCommandResult {
  id: string;
  results: DatabaseSingleCommandResult[];
}
