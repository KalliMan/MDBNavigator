import { DatabaseCommandResultField } from "./databaseCommandResultField";

export interface DatabaseCommandBatchResult {
  id: string;
  index: number;
  resultJson: string;
}

export interface DatabaseCommandResult extends DatabaseCommandBatchResult {
  rowCount: number;
  fields: DatabaseCommandResultField[];
}

// export interface DatabaseCommantResultUI {
//   rows: object[];
// }
