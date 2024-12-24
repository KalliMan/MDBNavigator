import { DatabaseCommandQueryBase } from "./databaseCommandQueryBase";

export interface DatabaseSQLCommandQuery extends DatabaseCommandQueryBase {
  query: string;
}
