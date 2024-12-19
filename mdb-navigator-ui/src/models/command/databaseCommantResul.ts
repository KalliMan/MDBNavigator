import { DatabaseCommantResultField } from "./databaseCommantResultField";

export interface DatabaseCommandBatchResult {
  id: string;
  index: number;
  resultJson: string;
}

export interface DatabaseCommantResult extends DatabaseCommandBatchResult {
  rowCount: number;
  fields: DatabaseCommantResultField[];
}

export interface DatabaseCommantResultUI {
  rows: object[];
}
