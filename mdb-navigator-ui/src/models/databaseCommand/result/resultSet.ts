import { CellValue } from "./cellValue";
import { DatabaseCommandResultField } from "./databaseCommandResultField";

// One result set of an execution, with its rows parsed once as they stream in.
export interface ResultSet {
  id: string;
  resultSetIndex: number;
  fields: DatabaseCommandResultField[];
  rows: CellValue[][];
  isComplete: boolean;
}
